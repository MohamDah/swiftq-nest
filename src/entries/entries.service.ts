import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JoinQueueDto } from 'src/queues/dto/join-queue.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import {
  generateDisplayNumber,
  calculateActualPosition,
} from 'src/shared/utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntryEventDto } from './dto/entry-event.dto';
import { QueueEventDto } from 'src/queues/dto/queue-event.dto';

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async generateUniqueDisplayNumber(
    queueId: string,
    tx: TransactionClient,
    maxAttempts: number = 10,
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const displayNumber = generateDisplayNumber();

      const existing = await tx.queueEntry.findFirst({
        where: {
          queueId,
          displayNumber,
          status: { in: ['WAITING', 'CALLED'] },
        },
      });

      if (!existing) {
        return displayNumber;
      }
    }

    // Fallback: use timestamp-based unique number
    return `X${Date.now().toString().slice(-2)}`;
  }

  async checkExistingEntry(qrCode: string, sessionToken?: string) {
    if (!sessionToken) {
      return { hasEntry: false };
    }

    const queue = await this.prisma.queue.findUnique({
      where: { qrCode },
      select: { id: true },
    });

    if (!queue) {
      return { hasEntry: false };
    }

    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        id: sessionToken,
        queueId: queue.id,
        status: { in: ['WAITING', 'CALLED'] },
      },
      select: {
        id: true,
        displayNumber: true,
        position: true,
        status: true,
        estimatedWaitTime: true,
        customerName: true,
        joinedAt: true,
      },
    });

    return {
      hasEntry: !!entry,
      entry,
    };
  }

  async joinQueue(dto: JoinQueueDto, qrCode: string) {
    return this.prisma
      .$transaction(async (tx) => {
        const queue = await tx.queue.findUniqueOrThrow({
          where: { qrCode, deletedAt: null },
          select: {
            id: true,
            isActive: true,
            maxSize: true,
            averageServiceTime: true,
            requireNames: true,
            _count: {
              select: {
                entries: {
                  where: { status: { in: ['WAITING', 'CALLED'] } },
                },
              },
            },
          },
        });

        if (queue.requireNames && !dto.customerName) {
          throw new BadRequestException('customerName is required');
        }

        if (!queue.isActive) {
          throw new BadRequestException(
            'This queue is not accepting new customers',
          );
        }

        const currentSize = queue._count.entries;

        if (queue.maxSize && currentSize >= queue.maxSize) {
          throw new BadRequestException('Queue is at maximum capacity');
        }

        const position = currentSize + 1;
        const estimatedWaitTime = position * queue.averageServiceTime;

        // Generate unique display number
        const displayNumber = await this.generateUniqueDisplayNumber(
          queue.id,
          tx,
        );

        const entry = await tx.queueEntry.create({
          data: {
            queueId: queue.id,
            displayNumber,
            customerName: dto.customerName,
            position,
            estimatedWaitTime,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          select: {
            id: true,
            displayNumber: true,
            customerName: true,
            position: true,
            estimatedWaitTime: true,
            joinedAt: true,
            status: true,
            queueId: true,
          },
        });

        return { ...entry, qrCode };
      })
      .then((data) => {
        this.eventEmitter.emit('queue.updated', {
          type: 'ENTRY_JOINED',
          queueId: data.queueId,
        } as QueueEventDto);
        return data;
      });
  }

  async getEntryStatus(entryId: string) {
    const entry = await this.prisma.queueEntry.findUniqueOrThrow({
      where: { id: entryId },
      select: {
        id: true,
        position: true, // Original position
        status: true,
        estimatedWaitTime: true,
        customerName: true,
        displayNumber: true,
        joinedAt: true,
        calledAt: true,
        queue: {
          select: {
            id: true,
            qrCode: true,
            name: true,
            description: true,
            averageServiceTime: true,
            isActive: true,
            host: { select: { businessName: true } },
            entries: {
              where: { status: { in: ['WAITING', 'CALLED'] } },
              select: { position: true },
            },
          },
        },
      },
    });

    const actualPosition = calculateActualPosition(
      entry.position,
      entry.queue.entries,
    );

    return {
      sessionToken: entry.id,
      position: actualPosition,
      status: entry.status,
      estimatedWaitTime: actualPosition * entry.queue.averageServiceTime,
      customerName: entry.customerName,
      displayNumber: entry.displayNumber,
      joinedAt: entry.joinedAt,
      calledAt: entry.calledAt,
      peopleAhead: actualPosition - 1,
      queue: {
        id: entry.queue.id,
        qrCode: entry.queue.qrCode,
        name: entry.queue.name,
        description: entry.queue.description,
        businessName: entry.queue.host.businessName,
        totalWaiting: entry.queue.entries.length,
        isActive: entry.queue.isActive,
        averageServiceTime: entry.queue.averageServiceTime,
      },
    };
  }

  async cancelEntry(entryId: string) {
    return this.prisma
      .$transaction(async (tx) => {
        const entry = await tx.queueEntry.findUniqueOrThrow({
          where: { id: entryId },
          select: {
            id: true,
            queueId: true,
            position: true,
            status: true,
            displayNumber: true,
            queue: {
              select: { qrCode: true },
            },
          },
        });

        // Validate state transition
        if (!['WAITING', 'CALLED'].includes(entry.status)) {
          throw new BadRequestException(
            `Cannot cancel entry with status: ${entry.status}`,
          );
        }

        // Update entry status
        await tx.queueEntry.update({
          where: { id: entryId },
          data: {
            status: 'CANCELLED',
            // Keep position/displayNumber for audit trail
          },
        });

        // Shift positions down for everyone behind
        await tx.queueEntry.updateMany({
          where: {
            queueId: entry.queueId,
            position: { gt: entry.position },
            status: { in: ['WAITING', 'CALLED'] },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        await this.recalculateWaitTimes(entry.queueId, tx);

        return {
          success: true,
          message: 'Successfully left queue',
          displayNumber: entry.displayNumber,
          qrCode: entry.queue.qrCode,
          queueId: entry.queueId,
        };
      })
      .then(({ qrCode, queueId, ...data }) => {
        this.eventEmitter.emit('entry.updated', {
          qrCode,
          type: 'QUEUE_ADVANCED',
        } as EntryEventDto);

        this.eventEmitter.emit('queue.updated', {
          queueId,
          type: 'QUEUE_ADVANCED',
        } as QueueEventDto);

        return data;
      });
  }

  async callEntry(entryId: string, hostId: string) {
    return this.prisma
      .$transaction(async (tx) => {
        const entry = await tx.queueEntry.findUniqueOrThrow({
          where: { id: entryId },
          include: {
            queue: {
              select: { hostId: true, qrCode: true },
            },
          },
        });

        // Authorization: Only queue owner can call
        if (entry.queue.hostId !== hostId) {
          throw new ForbiddenException('You do not own this queue');
        }

        // Validate state transition
        if (entry.status !== 'WAITING') {
          throw new BadRequestException(
            `Cannot call customer with status: ${entry.status}`,
          );
        }

        const updated = await tx.queueEntry.update({
          where: { id: entryId },
          data: {
            status: 'CALLED',
            calledAt: new Date(),
          },
          select: {
            id: true,
            displayNumber: true,
            customerName: true,
            position: true,
            queueId: true,
          },
        });

        this.eventEmitter.emit('entry.updated', {
          type: 'STATUS_CHANGE',
          qrCode: entry.queue.qrCode,
          sessionToken: entryId,
        } as EntryEventDto);

        return { ...updated, qrCode: entry.queue.qrCode };
      })
      .then(({ qrCode, ...data }) => {
        this.eventEmitter.emit('entry.updated', {
          qrCode,
          type: 'QUEUE_ADVANCED',
        } as EntryEventDto);

        return data;
      });
  }

  async serveEntry(entryId: string, hostId: string) {
    return this.prisma
      .$transaction(async (tx) => {
        const entry = await tx.queueEntry.findUniqueOrThrow({
          where: { id: entryId },
          include: {
            queue: {
              select: { hostId: true, qrCode: true },
            },
          },
        });

        // Authorization
        if (entry.queue.hostId !== hostId) {
          throw new ForbiddenException('You do not own this queue');
        }

        // Validate state transition (must be called first)
        if (entry.status !== 'CALLED') {
          throw new BadRequestException(
            `Customer must be called before serving. Current status: ${entry.status}`,
          );
        }

        // Mark as served
        const updated = await tx.queueEntry.update({
          where: { id: entryId },
          data: {
            status: 'SERVED',
            servedAt: new Date(),
          },
          select: {
            id: true,
            displayNumber: true,
            queueId: true,
          },
        });

        return {
          success: true,
          message: `Served customer ${updated.displayNumber}`,
          qrCode: entry.queue.qrCode,
        };
      })
      .then(({ qrCode, ...data }) => {
        this.eventEmitter.emit('entry.updated', {
          qrCode,
          type: 'QUEUE_ADVANCED',
        } as EntryEventDto);

        return data;
      });
  }

  // HELPERS
  private async recalculateWaitTimes(queueId: string, tx: TransactionClient) {
    const queue = await tx.queue.findUniqueOrThrow({
      where: { id: queueId },
      select: { averageServiceTime: true },
    });

    const waitingCustomers = await tx.queueEntry.findMany({
      where: {
        queueId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      orderBy: { position: 'asc' },
      select: { id: true, position: true },
    });

    // Recalculate based on actual position in line
    let actualPosition = 1;
    for (const customer of waitingCustomers) {
      await tx.queueEntry.update({
        where: { id: customer.id },
        data: {
          estimatedWaitTime: actualPosition * queue.averageServiceTime,
        },
      });
      actualPosition++;
    }
  }
}
