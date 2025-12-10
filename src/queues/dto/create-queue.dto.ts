import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { Prisma } from 'src/generated/prisma/client';

export class CreateQueueDto implements Omit<
  Prisma.QueueCreateInput,
  'host' | 'qrCode'
> {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsBoolean()
  requireNames?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  averageServiceTime?: number | undefined;

  @IsOptional()
  @IsString()
  description?: string | null | undefined;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxSize?: number | null | undefined;
}
