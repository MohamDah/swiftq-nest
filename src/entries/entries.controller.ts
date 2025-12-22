import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntryEventDto } from './dto/entry-event.dto';

@Controller('entries')
export class EntriesController {
  constructor(
    private readonly entriesService: EntriesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  @Sse('updates/:qrCode/:sessionToken')
  async sse(
    @Param('qrCode') qrCode: string,
    @Param('sessionToken') sessionToken: string,
  ): Promise<Observable<MessageEvent>> {
    const { hasEntry } = await this.entriesService.checkExistingEntry(
      qrCode,
      sessionToken,
    );
    if (!hasEntry) throw new UnauthorizedException();

    return fromEvent(this.eventEmitter, 'entry.updated').pipe(
      filter((payload: EntryEventDto) => {
        const isCorrectQueue = payload.qrCode === qrCode;

        const isForThisCustomer = payload.sessionToken
          ? payload.sessionToken === sessionToken
          : true;

        return isCorrectQueue && isForThisCustomer;
      }),
      map((payload) => ({
        data: {
          type: payload.type,
        },
      })),
    );
  }
}
