import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from 'src/generated/prisma/client';

export class CreateHostDto implements Prisma.HostCreateInput {
  @ApiProperty({ example: 'Acme Corp', minLength: 3 })
  @IsString()
  @MinLength(3)
  businessName: string;

  @ApiProperty({ example: 'host@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsStrongPassword({
    minSymbols: 0,
  })
  password: string;
}
