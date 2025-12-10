import {
  Body,
  Controller,
  Get,
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
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { AuthReq } from 'src/shared/decorators/auth.decorator';

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
  login(@CurrentUser() user: HostDto) {
    return this.authService.login(user);
  }

  @AuthReq()
  @Get()
  findLoggedIn(@CurrentUser() user: HostDto) {
    return this.authService.findOne(user.id);
  }
}
