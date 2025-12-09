import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { HostDto } from 'src/auth/dto/host.dto';

export const CurrentUser = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: HostDto }>();
    return request.user;
  },
);
