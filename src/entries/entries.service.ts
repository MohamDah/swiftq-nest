import { BadRequestException, Body, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JoinQueueDto } from 'src/queues/dto/join-queue.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { generateDisplayNumber } from 'src/shared/utils';

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.$transaction(async (tx) => {
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
        },
      });

      return { ...entry, qrCode };
    });
  }

  async getEntryStatus(entryId: string) {
    const entry = await this.prisma.queueEntry.findUniqueOrThrow({
      where: { id: entryId },
      select: {
        id: true,
        position: true,
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
            _count: {
              select: {
                entries: {
                  where: { status: { in: ['WAITING', 'CALLED'] } },
                },
              },
            },
          },
        },
      },
    });

    const peopleAhead = await this.prisma.queueEntry.count({
      where: {
        queueId: entry.queue.id,
        status: { in: ['WAITING', 'CALLED'] },
        position: { lt: entry.position },
      },
    });

    return {
      sessionToken: entry.id,
      position: entry.position,
      status: entry.status,
      estimatedWaitTime: entry.estimatedWaitTime,
      customerName: entry.customerName,
      displayNumber: entry.displayNumber,
      joinedAt: entry.joinedAt,
      calledAt: entry.calledAt,
      peopleAhead,
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

  async update(entryId: string, dto: UpdateEntryDto = {}) {
    return this.prisma.queueEntry.update({
      where: { id: entryId },
      data: dto,
    });
  }
}
