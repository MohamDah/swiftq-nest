import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({ description: 'Firebase Cloud Messaging token' })
  @IsNotEmpty()
  @IsString()
  fcmToken: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 (Linux; Android 10)' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
