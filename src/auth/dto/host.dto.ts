import { Prisma } from 'src/generated/prisma/client';

export class HostDto implements Omit<
  Prisma.HostModel,
  'password' | 'createdAt' | 'updatedAt'
> {
  id: string;
  businessName: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
