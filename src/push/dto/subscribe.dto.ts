import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @IsNotEmpty()
  @IsString()
  fcmToken: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
