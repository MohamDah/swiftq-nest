import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Patch(':entryId')
  update(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.entriesService.update(entryId, dto);
  }
}
