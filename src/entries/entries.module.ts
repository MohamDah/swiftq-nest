import { Module } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EntriesController } from './entries.controller';

@Module({
  providers: [EntriesService],
  imports: [PrismaModule],
  exports: [EntriesService],
  controllers: [EntriesController],
})
export class EntriesModule {}
