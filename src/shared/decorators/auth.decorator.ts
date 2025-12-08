import { SetMetadata } from '@nestjs/common';

export const AUTH_KEY = 'AUTH';

export const Public = (isPublic: boolean = true) =>
  SetMetadata(AUTH_KEY, isPublic);
