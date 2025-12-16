import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post(':entryId/cancel')
  cancel(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.entriesService.cancelEntry(entryId);
  }

  @AuthReq()
  @Post(':entryId/call')
  call(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.entriesService.callEntry(entryId, host.id);
  }

  @AuthReq()
  @Post(':entryId/serve')
  serve(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.entriesService.serveEntry(entryId, host.id);
  }
}
