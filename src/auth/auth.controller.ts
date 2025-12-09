import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateHostDto } from './dto/create-host.dto';
import { AuthService } from './auth.service';
import { HostDto } from './dto/host.dto';
import { LocalGuard } from './guards/local.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: CreateHostDto) {
    return this.authService.create(body);
  }

  @UseGuards(LocalGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Request() req: { user: HostDto }) {
    return this.authService.login(req.user);
  }
}
