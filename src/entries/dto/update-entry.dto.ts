import { IsEnum, IsOptional } from 'class-validator';
import { Prisma, QueueEntryStatus } from 'src/generated/prisma/client';

export class UpdateEntryDto implements Prisma.QueueEntryUpdateInput {
  @IsOptional()
  @IsEnum(QueueEntryStatus)
  status?: QueueEntryStatus;
}
