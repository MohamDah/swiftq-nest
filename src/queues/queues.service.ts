import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { generateId } from 'src/shared/utils';
import { JoinQueueDto } from './dto/join-queue.dto';

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.queue.findMany({ where: { hostId } });
  }

  findOne(qrCode: string) {
    return this.prisma.queue.findUniqueOrThrow({
      where: { qrCode },
      include: {
        entries: {
          where: { status: { in: ['WAITING', 'CALLED'] } },
          orderBy: { position: 'asc' },
          select: {
            customerName: true,
            position: true,
            status: true,
            estimatedWaitTime: true,
            calledAt: true,
            servedAt: true,
          },
        },
        host: { omit: { password: true, createdAt: true, updatedAt: true } },
      },
    });
  }

  async joinQueue(dto: JoinQueueDto, qrCode: string) {
    return this.prisma.$transaction(async (tx) => {
      const queue = await tx.queue.findUniqueOrThrow({
        where: { qrCode },
        select: {
          id: true,
          isActive: true,
          maxSize: true,
          averageServiceTime: true,
          _count: {
            select: {
              entries: {
                where: { status: { in: ['WAITING', 'CALLED'] } },
              },
            },
          },
        },
      });

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

      const entry = await tx.queueEntry.create({
        data: {
          queueId: queue.id,
          customerName: dto.customerName,
          position,
          estimatedWaitTime,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        select: {
          id: true,
          position: true,
          estimatedWaitTime: true,
          joinedAt: true,
          status: true,
        },
      });

      return entry;
    });
  }
}
