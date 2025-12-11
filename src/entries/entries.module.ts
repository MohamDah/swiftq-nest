import { Module } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [EntriesService],
  imports: [PrismaModule],
  exports: [EntriesService],
})
export class EntriesModule {}
