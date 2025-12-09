import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { generateId } from 'src/shared/utils';

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateQueueDto, hostId: string) {
    return this.prisma.queue.create({
      data: {
        ...dto,
        qrCode: generateId(),
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
        entries: true,
        host: { omit: { password: true, createdAt: true, updatedAt: true } },
      },
    });
  }
}
