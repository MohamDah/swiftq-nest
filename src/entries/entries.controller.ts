import { Controller, Param, ParseUUIDPipe, Post, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EntriesService } from './entries.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';

@ApiTags('entries')
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @ApiOperation({
    summary: 'Get the current status and position of a queue entry',
  })
  @ApiOkResponse({ description: 'Returns the entry status and position' })
  @Get(':entryId/status')
  async getEntryStatus(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.entriesService.getEntryStatus(entryId);
  }

  @ApiOperation({ summary: 'Cancel a queue entry' })
  @ApiOkResponse({ description: 'Entry cancelled successfully' })
  @ApiNotFoundResponse({ description: 'Entry not found' })
  @ApiBadRequestResponse({
    description:
      'Entry is not in a cancellable state (must be WAITING or CALLED)',
  })
  @Post(':entryId/cancel')
  cancel(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.entriesService.cancelEntry(entryId);
  }

  @ApiOperation({ summary: 'Call a customer to be served' })
  @ApiOkResponse({ description: 'Entry status updated to called' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiNotFoundResponse({ description: 'Entry not found' })
  @ApiForbiddenResponse({
    description: 'Authenticated host does not own the queue',
  })
  @ApiBadRequestResponse({ description: 'Entry is not in WAITING state' })
  @ApiBearerAuth()
  @AuthReq()
  @Post(':entryId/call')
  call(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.entriesService.callEntry(entryId, host.id);
  }

  @ApiOperation({ summary: 'Mark an entry as served' })
  @ApiOkResponse({ description: 'Entry status updated to served' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiNotFoundResponse({ description: 'Entry not found' })
  @ApiForbiddenResponse({
    description: 'Authenticated host does not own the queue',
  })
  @ApiBadRequestResponse({ description: 'Entry is not in CALLED state' })
  @ApiBearerAuth()
  @AuthReq()
  @Post(':entryId/serve')
  serve(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.entriesService.serveEntry(entryId, host.id);
  }

  @ApiOperation({ summary: 'Mark a customer as a no-show' })
  @ApiOkResponse({ description: 'Entry status updated to no-show' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiNotFoundResponse({ description: 'Entry not found' })
  @ApiForbiddenResponse({
    description: 'Authenticated host does not own the queue',
  })
  @ApiBadRequestResponse({ description: 'Entry is not in CALLED state' })
  @ApiBearerAuth()
  @AuthReq()
  @Post(':entryId/no-show')
  markNoShow(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.entriesService.markNoShow(entryId, host.id);
  }
}
