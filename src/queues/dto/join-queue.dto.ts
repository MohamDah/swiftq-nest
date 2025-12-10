import { IsString, MinLength } from 'class-validator';

export class JoinQueueDto {
  @IsString()
  @MinLength(3)
  customerName: string;
}
