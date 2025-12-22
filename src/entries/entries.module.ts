import { Module } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EntriesController } from './entries.controller';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [EntriesService, EventEmitter2],
  imports: [PrismaModule],
  exports: [EntriesService],
  controllers: [EntriesController],
})
export class EntriesModule {}
