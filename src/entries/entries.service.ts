import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEntryStatus(entryId: string) {
    const entry = await this.prisma.queueEntry.findUniqueOrThrow({
      where: { id: entryId },
      select: {
        id: true,
        position: true,
        status: true,
        estimatedWaitTime: true,
        customerName: true,
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
}
