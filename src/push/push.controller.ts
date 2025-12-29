import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { PushService } from './push.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe/:entryId')
  subscribe(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.pushService.subscribe(entryId, dto.fcmToken, dto.userAgent);
  }

  @Delete('unsubscribe')
  unsubscribe(@Body('fcmToken') fcmToken: string) {
    return this.pushService.unsubscribe(fcmToken);
  }

  @Get('status/:entryId')
  getStatus(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.pushService.getSubscriptionStatus(entryId);
  }
}
