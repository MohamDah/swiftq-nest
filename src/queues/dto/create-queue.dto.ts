import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from 'src/generated/prisma/client';

export class CreateQueueDto implements Omit<
  Prisma.QueueCreateInput,
  'host' | 'qrCode'
> {
  @ApiProperty({ example: 'Support Queue', minLength: 3 })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether customers must provide their name when joining',
  })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsBoolean()
  requireNames?: boolean;

  @ApiPropertyOptional({
    example: 5,
    description: 'Average service time in minutes',
  })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  averageServiceTime?: number | undefined;

  @ApiPropertyOptional({ example: 'Walk-in support queue for customers' })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsString()
  description?: string | null | undefined;

  @ApiPropertyOptional({
    example: 50,
    description: 'Maximum number of simultaneous entries allowed',
  })
  @Transform(({ value }): any => value ?? undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxSize?: number | null | undefined;
}
