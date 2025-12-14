import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { EntriesService } from './entries.service';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post(':entryId/cancel')
  cancel(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.entriesService.cancelEntry(entryId);
  }
}
