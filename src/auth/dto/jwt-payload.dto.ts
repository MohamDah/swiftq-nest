import { HostDto } from './host.dto';

export class JwtPayload implements Omit<HostDto, 'id'> {
  sub: string;
  businessName: string;
  email: string;
}
