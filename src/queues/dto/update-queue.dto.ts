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
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  averageServiceTime?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxSize?: number;

  @IsOptional()
  @IsBoolean()
  requireNames?: boolean;
}
