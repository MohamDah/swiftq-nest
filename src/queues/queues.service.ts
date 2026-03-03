import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { generateId } from 'src/shared/utils';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { EventsService } from 'src/events/events.service';
import { QueueEventType } from 'src/shared/events';
import { TimeRangeFilter } from './dto/analytics-query.dto';
import getDateRange from './utils/getDateRange';
import { Prisma } from 'src/generated/prisma/client';
import { AnalyticsDto } from './dto/analytics.dto';

@Injectable()
export class QueuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  private async generateUniqueQRCode(maxAttempts: number = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = generateId();

      const existing = await this.prisma.queue.findUnique({
        where: { qrCode: code, deletedAt: null },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }

      console.warn(
        `QR code collision detected: ${code} (attempt ${attempt + 1})`,
      );
    }

    throw new InternalServerErrorException(
      'Failed to generate unique QR code after multiple attempts',
    );
  }

  async create(dto: CreateQueueDto, hostId: string) {
    const qrCode = await this.generateUniqueQRCode();

    return this.prisma.queue.create({
      data: {
        ...dto,
        qrCode,
        host: { connect: { id: hostId } },
      },
    });
  }

  getAll(hostId: string) {
    return this.prisma.queue.findMany({
      where: { hostId, deletedAt: null },
      include: {
        _count: {
          select: {
            entries: {
              where: { status: { in: ['WAITING', 'CALLED'] } },
            },
          },
        },
      },
    });
  }

  async getOnePublic(qrCode: string) {
    const queue = await this.prisma.queue.findUniqueOrThrow({
      where: { qrCode, deletedAt: null },
      select: {
        name: true,
        description: true,
        isActive: true,
        maxSize: true,
        averageServiceTime: true,
        requireNames: true,
        host: {
          select: {
            businessName: true,
          },
        },
        _count: {
          select: {
            entries: {
              where: { status: { in: ['WAITING', 'CALLED'] } },
            },
          },
        },
      },
    });

    return {
      qrCode,
      name: queue.name,
      description: queue.description,
      businessName: queue.host.businessName,
      isActive: queue.isActive,
      requireNames: queue.requireNames,
      currentSize: queue._count.entries,
      maxSize: queue.maxSize,
      averageServiceTime: queue.averageServiceTime,
    };
  }

  async getOneManage(id: string, hostId: string) {
    const queue = await this.prisma.queue.findUniqueOrThrow({
      where: { id, hostId, deletedAt: null },
      include: {
        entries: {
          where: { status: { in: ['WAITING', 'CALLED'] } },
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            displayNumber: true,
            customerName: true,
            status: true,
            joinedAt: true,
            calledAt: true,
          },
        },
        host: {
          select: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    return {
      ...queue,
      entries: queue.entries.map((entry, index) => ({
        ...entry,
        position: index + 1,
        estimatedWaitTime: (index + 1) * queue.averageServiceTime,
      })),
    };
  }

  delete(queueId: string, hostId: string) {
    return this.prisma.$transaction(async (tx) => {
      const queue = await tx.queue.findFirst({
        where: { id: queueId, deletedAt: null, hostId },
        include: {
          _count: {
            select: {
              entries: {
                where: { status: { in: ['WAITING', 'CALLED'] } },
              },
            },
          },
        },
      });

      if (!queue) {
        throw new NotFoundException('Queue not found');
      }

      if (queue._count.entries > 0) {
        throw new BadRequestException(
          `Cannot delete queue with ${queue._count.entries} active customers. ` +
            'Please serve or cancel all customers first, or disable the queue instead.',
        );
      }

      return tx.queue.update({
        where: { id: queueId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });
    });
  }

  async update(queueId: string, hostId: string, dto: UpdateQueueDto) {
    const queue = await this.prisma.queue.update({
      where: { id: queueId, deletedAt: null, hostId },
      data: dto,
    });
    this.eventsService.emitQueueUpdate({
      queueId: queue.id,
      type: QueueEventType.QUEUE_UPDATED,
    });
    return queue;
  }

  async getAnalytics(
    hostId: string,
    filter: TimeRangeFilter,
  ): Promise<AnalyticsDto> {
    const { startDate, endDate } = getDateRange(filter);

    const entriesWhere: Prisma.QueueEntryWhereInput = {
      queue: { hostId },
    };
    if (startDate && endDate) {
      entriesWhere.joinedAt = { gte: startDate, lte: endDate };
    }

    const entries = await this.prisma.queueEntry.findMany({
      where: entriesWhere,
      select: { queueId: true, joinedAt: true, servedAt: true, status: true },
    });

    // Calculate peak hour
    const hourCounts: Record<number, number> = {};
    for (const ent of entries) {
      const hour = ent.joinedAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    let peakHour = 0;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > peakCount) {
        peakHour = parseInt(hour);
        peakCount = count;
      }
    });

    // Calculate average wait time
    const servedEntries = entries.filter(
      (e) => e.status === 'SERVED' && e.servedAt != null,
    );
    const totalWaitTimes = servedEntries.reduce((a, e) => {
      const waitTimeMs = e.servedAt!.getTime() - e.joinedAt.getTime();
      const waitTimeMinutes = waitTimeMs / (1000 * 60);
      return a + waitTimeMinutes;
    }, 0);
    const averageWaitTime =
      Math.round((totalWaitTimes / servedEntries.length) * 10) / 10;

    // Calculate average customers
    const totalCustomers = entries.length;
    const totalQueues = new Set(entries.map((e) => e.queueId)).size;
    const averageCustomers =
      Math.round((totalCustomers / totalQueues) * 10) / 10;

    return {
      peakHour: {
        hour: peakHour,
        count: peakCount,
      },
      averageWaitTime,
      averageCustomers,
      totalCustomers,
      totalQueues,
    };
  }
}
