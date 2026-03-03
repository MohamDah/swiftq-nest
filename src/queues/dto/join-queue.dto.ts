import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinQueueDto {
  @ApiPropertyOptional({ example: 'John Doe', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  customerName?: string;
}
