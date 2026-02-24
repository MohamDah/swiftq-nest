import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JoinQueueDto } from 'src/queues/dto/join-queue.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { generateDisplayNumber } from 'src/shared/utils';
import { EventsService } from 'src/events/events.service';
import { PushService } from 'src/push/push.service';
import { QueueEntryStatus } from 'src/generated/prisma/enums';

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly pushService: PushService,
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
      where: { qrCode, deletedAt: null },
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
      },
    });

    return {
      hasEntry: !!entry,
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
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          select: {
            id: true,
            displayNumber: true,
            customerName: true,
            joinedAt: true,
            status: true,
            queueId: true,
          },
        });

        return { ...entry, qrCode };
      })
      .then((data) => {
        this.eventsService.emitEntryJoined(data.queueId);
        return data;
      });
  }

  async getEntryStatus(entryId: string) {
    const entry = await this.prisma.queueEntry.findUniqueOrThrow({
      where: { id: entryId },
      select: {
        id: true,
        status: true,
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
            _count: {
              select: {
                entries: {
                  where: {
                    status: {
                      in: [QueueEntryStatus.WAITING, QueueEntryStatus.CALLED],
                    },
                  },
                },
              },
            },
          },
        },
        pushSubscription: { select: { id: true } },
      },
    });

    const aheadEntries = await this.prisma.queueEntry.count({
      where: {
        queueId: entry.queue.id,
        status: { in: [QueueEntryStatus.WAITING, QueueEntryStatus.CALLED] },
        joinedAt: { lt: entry.joinedAt },
      },
    });

    const position = aheadEntries + 1;

    return {
      sessionToken: entry.id,
      position,
      status: entry.status,
      customerName: entry.customerName,
      displayNumber: entry.displayNumber,
      joinedAt: entry.joinedAt,
      calledAt: entry.calledAt,
      peopleAhead: aheadEntries,
      hasNotifications: !!entry.pushSubscription,
      queue: {
        id: entry.queue.id,
        qrCode: entry.queue.qrCode,
        name: entry.queue.name,
        description: entry.queue.description,
        businessName: entry.queue.host.businessName,
        totalWaiting: entry.queue._count.entries,
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
          },
        });

        return {
          success: true,
          message: 'Successfully left queue',
          displayNumber: entry.displayNumber,
          qrCode: entry.queue.qrCode,
          queueId: entry.queueId,
          entryId: entry.id,
        };
      })
      .then(({ qrCode, queueId, entryId, ...data }) => {
        this.eventsService.emitQueueAdvanced(queueId, qrCode);

        void this.pushService.deleteSubscriptionByEntry(entryId);

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
            queueId: true,
          },
        });

        return { ...updated, qrCode: entry.queue.qrCode };
      })
      .then((result) => {
        const { qrCode, ...data } = result;

        // Emit SSE event for real-time updates
        this.eventsService.emitEntryCall(qrCode, entryId);

        // Send push notification (fire and forget)
        void this.pushService.sendNotification(entryId, {
          title: "You're being called!",
          body: `${data.displayNumber}${data.customerName ? ` - ${data.customerName}` : ''} - Please proceed to the counter`,
          data: {
            qrCode: qrCode,
          },
        });

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
          queueId: entry.queueId,
          entryId: updated.id,
        };
      })
      .then(({ qrCode, queueId, entryId, ...data }) => {
        this.eventsService.emitQueueAdvanced(queueId, qrCode);

        void this.pushService.deleteSubscriptionByEntry(entryId);

        return data;
      });
  }

  async markNoShow(entryId: string, hostId: string) {
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

        // Validate state transition (must be CALLED to mark as NO_SHOW)
        if (entry.status !== 'CALLED') {
          throw new BadRequestException(
            `Can only mark called customers as no-show. Current status: ${entry.status}`,
          );
        }

        // Mark as NO_SHOW
        const updated = await tx.queueEntry.update({
          where: { id: entryId },
          data: {
            status: 'NO_SHOW',
          },
          select: {
            id: true,
            displayNumber: true,
            queueId: true,
          },
        });

        return {
          success: true,
          message: `Marked customer ${updated.displayNumber} as no-show`,
          qrCode: entry.queue.qrCode,
          queueId: entry.queueId,
          entryId: updated.id,
        };
      })
      .then(({ qrCode, queueId, entryId, ...data }) => {
        this.eventsService.emitQueueAdvanced(queueId, qrCode);

        void this.pushService.deleteSubscriptionByEntry(entryId);

        return data;
      });
  }
}
