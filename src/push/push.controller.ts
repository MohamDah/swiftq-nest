import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PushService } from './push.service';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('push')
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @ApiOperation({ summary: 'Subscribe an entry to push notifications' })
  @ApiCreatedResponse({ description: 'Subscription created successfully' })
  @ApiNotFoundResponse({ description: 'Entry not found' })
  @Post('subscribe/:entryId')
  subscribe(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.pushService.subscribe(entryId, dto.fcmToken, dto.userAgent);
  }

  @ApiOperation({ summary: 'Unsubscribe a device from push notifications' })
  @ApiOkResponse({ description: 'Subscription removed successfully' })
  @Delete('unsubscribe')
  unsubscribe(@Body('fcmToken') fcmToken: string) {
    return this.pushService.unsubscribe(fcmToken);
  }

  @ApiOperation({ summary: 'Get push subscription status for an entry' })
  @ApiOkResponse({ description: 'Returns subscription status' })
  @Get('status/:entryId')
  getStatus(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.pushService.getSubscriptionStatus(entryId);
  }
}
