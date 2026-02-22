import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHostDto } from './dto/create-host.dto';
import bcrypt from 'bcrypt';
import { HostDto } from './dto/host.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser({ email, password }: LoginDto): Promise<HostDto> {
    const user = await this.prisma.host.findUnique({
      where: { email },
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: voidPass, ...result } = user;
      void voidPass;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async create(dto: CreateHostDto) {
    const hashedPass = await bcrypt.hash(dto.password, 10);

    const newHost = await this.prisma.host.create({
      data: {
        ...dto,
        password: hashedPass,
      },
      omit: {
        password: true,
      },
    });

    const { id, email, businessName } = newHost;

    const { accessToken } = this.login({ id, email, businessName });

    return {
      user: newHost,
      accessToken,
    };
  }

  login(user: HostDto) {
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        businessName: user.businessName,
      }),
    };
  }

  findOne(id: string) {
    return this.prisma.host.findUnique({ where: { id } });
  }
}
