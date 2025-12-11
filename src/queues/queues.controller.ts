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
} from '@nestjs/common';
import { QueuesService } from './queues.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CreateQueueDto } from './dto/create-queue.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { EntriesService } from 'src/entries/entries.service';

@Controller('queues')
export class QueuesController {
  constructor(
    private readonly queuesService: QueuesService,
    private readonly entriesService: EntriesService,
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
    return this.queuesService.checkExistingEntry(qrCode, token);
  }

  @Get('entry-status/:entryId')
  async getEntryStatus(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.entriesService.getEntryStatus(entryId);
  }

  @Post(':qrCode/join')
  joinQueue(@Param('qrCode') qrCode: string, @Body() dto: JoinQueueDto) {
    return this.queuesService.joinQueue(dto, qrCode);
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
}
