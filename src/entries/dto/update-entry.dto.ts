import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, QueueEntryStatus } from 'src/generated/prisma/client';

export class UpdateEntryDto implements Prisma.QueueEntryUpdateInput {
  @ApiPropertyOptional({ enum: QueueEntryStatus })
  @IsOptional()
  @IsEnum(QueueEntryStatus)
  status?: QueueEntryStatus;
}
