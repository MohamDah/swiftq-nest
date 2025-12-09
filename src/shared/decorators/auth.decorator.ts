import { SetMetadata } from '@nestjs/common';

export const AUTH_KEY = 'AUTH';

export const AuthReq = (isPublic: boolean = true) =>
  SetMetadata(AUTH_KEY, isPublic);
