import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHostDto } from './dto/create-host.dto';
import bcrypt from 'bcrypt';
import { HostDto } from './dto/host.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.host.findUnique({
      where: { email },
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      void password;
      return result;
    }
    return null;
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
}
