import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from 'src/generated/prisma/client';

export class UpdateQueueDto implements Prisma.QueueUpdateInput {
  @ApiPropertyOptional({ example: true })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 5,
    description: 'Average service time in minutes',
  })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  averageServiceTime?: number;

  @ApiPropertyOptional({ example: 'Updated Queue Name', minLength: 3 })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of simultaneous entries allowed',
  })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxSize?: number;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsBoolean()
  requireNames?: boolean;
}
