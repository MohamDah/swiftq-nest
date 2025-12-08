import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { Prisma } from 'src/generated/prisma/client';

export class CreateHostDto implements Prisma.HostCreateInput {
  @IsString()
  @MinLength(3)
  businessName: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({
    minSymbols: 0,
  })
  password: string;
}
