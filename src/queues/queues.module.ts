import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [QueuesController],
  providers: [QueuesService],
  imports: [PrismaModule],
})
export class QueuesModule {}
