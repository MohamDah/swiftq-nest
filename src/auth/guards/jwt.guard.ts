import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { HostDto } from '../dto/host.dto';
import { AUTH_KEY } from 'src/shared/decorators/auth.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest<T = HostDto>(
    err: any,
    user: T,
    info: any,
    context: ExecutionContext,
  ) {
    const isAuth = this.reflector.getAllAndOverride<boolean | undefined>(
      AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isAuth && !user) {
      return;
    }
    if (user) {
      return user;
    }
    throw new UnauthorizedException();
  }
}
