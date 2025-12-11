import { IsOptional, IsString, MinLength } from 'class-validator';

export class JoinQueueDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  customerName?: string;
}
