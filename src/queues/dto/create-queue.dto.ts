import { Transform } from 'class-transformer';
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

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsBoolean()
  requireNames?: boolean;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  averageServiceTime?: number | undefined;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsString()
  description?: string | null | undefined;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxSize?: number | null | undefined;
}
