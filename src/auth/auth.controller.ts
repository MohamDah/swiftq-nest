import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateHostDto } from './dto/create-host.dto';
import { AuthService } from './auth.service';
import { HostDto } from './dto/host.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: CreateHostDto) {
    return this.authService.create(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body);

    return this.authService.login(user);
  }

  @AuthReq()
  @Get()
  findLoggedIn(@CurrentUser() user: HostDto) {
    return this.authService.findOne(user.id);
  }
}
