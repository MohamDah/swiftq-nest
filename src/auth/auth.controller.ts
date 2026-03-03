import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateHostDto } from './dto/create-host.dto';
import { AuthService } from './auth.service';
import { HostDto } from './dto/host.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new host account' })
  @ApiCreatedResponse({
    description: 'Host registered successfully',
    type: HostDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed (invalid email, weak password, or businessName too short)',
  })
  @ApiConflictResponse({ description: 'Email is already in use' })
  @Post('register')
  register(@Body() body: CreateHostDto) {
    return this.authService.create(body);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns a JWT access token' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body);

    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Get the currently authenticated host profile' })
  @ApiOkResponse({
    description: 'Returns the current host profile',
    type: HostDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiBearerAuth()
  @AuthReq()
  @Get()
  findLoggedIn(@CurrentUser() user: HostDto) {
    return this.authService.findOne(user.id);
  }
}
