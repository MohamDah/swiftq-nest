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

export class UpdateQueueDto implements Prisma.QueueUpdateInput {
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  averageServiceTime?: number;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxSize?: number;

  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsBoolean()
  requireNames?: boolean;
}
