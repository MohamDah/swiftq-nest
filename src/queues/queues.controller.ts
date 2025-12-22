import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Sse,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import { QueuesService } from './queues.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CreateQueueDto } from './dto/create-queue.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { EntriesService } from 'src/entries/entries.service';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { QueueEventDto } from './dto/queue-event.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Controller('queues')
export class QueuesController {
  constructor(
    private readonly queuesService: QueuesService,
    private readonly entriesService: EntriesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  @AuthReq()
  @Post()
  create(@Body() dto: CreateQueueDto, @CurrentUser() host: HostDto) {
    return this.queuesService.create(dto, host.id);
  }

  @AuthReq()
  @Get()
  findAll(@CurrentUser() host: HostDto) {
    return this.queuesService.findAll(host.id);
  }

  @Get(':qrCode')
  findOnePublic(@Param('qrCode') qrCode: string) {
    return this.queuesService.findOnePublic(qrCode);
  }

  @Get(':id/manage')
  findOneManage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.queuesService.findOneManage(id, host.id);
  }

  @Get(':qrCode/check-entry')
  async checkExistingEntry(
    @Param('qrCode') qrCode: string,
    @Query('token', ParseUUIDPipe) token?: string,
  ) {
    return this.entriesService.checkExistingEntry(qrCode, token);
  }

  @Get('entry-status/:entryId')
  async getEntryStatus(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.entriesService.getEntryStatus(entryId);
  }

  @Post(':qrCode/join')
  joinQueue(@Param('qrCode') qrCode: string, @Body() dto: JoinQueueDto) {
    return this.entriesService.joinQueue(dto, qrCode);
  }

  @AuthReq()
  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() host: HostDto) {
    return this.queuesService.delete(id, host.id);
  }

  @AuthReq()
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() host: HostDto,
    @Body() dto: UpdateQueueDto,
  ) {
    return this.queuesService.update(id, host.id, dto);
  }

  @Sse('updates/:queueId')
  sse(
    @Param('queueId') queueId: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    try {
      jwt.verify(token, this.configService.getOrThrow('JWT_SECRET'));
    } catch {
      throw new UnauthorizedException();
    }

    return fromEvent(this.eventEmitter, 'queue.updated').pipe(
      filter((payload: QueueEventDto) => {
        return payload.queueId === queueId;
      }),
      map((payload) => ({
        data: {
          type: payload.type,
        },
      })),
    );
  }
}
