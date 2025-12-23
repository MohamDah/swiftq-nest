import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { generateId, enrichEntriesWithPositions } from 'src/shared/utils';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { EventsService } from 'src/events/events.service';
import { QueueEventType } from 'src/shared/events';

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
        where: { qrCode: code },
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
        hostId,
      },
    });
  }

  findAll(hostId: string) {
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

  async findOnePublic(qrCode: string) {
    const queue = await this.prisma.queue.findUniqueOrThrow({
      where: { qrCode },
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
      estimatedWaitTime: queue._count.entries * queue.averageServiceTime,
      isFull: queue.maxSize ? queue._count.entries >= queue.maxSize : false,
    };
  }

  async findOneManage(id: string, hostId: string) {
    const queue = await this.prisma.queue.findUniqueOrThrow({
      where: { id, hostId },
      include: {
        entries: {
          where: { status: { in: ['WAITING', 'CALLED'] } },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            displayNumber: true,
            customerName: true,
            position: true,
            status: true,
            estimatedWaitTime: true,
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

    // ✅ Enrich entries with actual positions
    const enrichedEntries = enrichEntriesWithPositions(queue.entries);

    return {
      ...queue,
      entries: enrichedEntries.map((entry) => ({
        id: entry.id,
        displayNumber: entry.displayNumber,
        customerName: entry.customerName,
        status: entry.status,
        joinedAt: entry.joinedAt,
        calledAt: entry.calledAt,
        position: entry.actualPosition,
        storedPosition: entry.position,
        estimatedWaitTime: entry.actualPosition * queue.averageServiceTime,
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
        throw new BadRequestException('Queue not found');
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
}
