import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EntriesModule } from 'src/entries/entries.module';

@Module({
  controllers: [QueuesController],
  providers: [QueuesService],
  imports: [PrismaModule, EntriesModule],
})
export class QueuesModule {}
