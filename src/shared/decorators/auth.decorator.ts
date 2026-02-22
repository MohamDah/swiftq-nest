import { SetMetadata } from '@nestjs/common';

export const AUTH_KEY = 'AUTH';

export const AuthReq = (isRequired: boolean = true) =>
  SetMetadata(AUTH_KEY, isRequired);
