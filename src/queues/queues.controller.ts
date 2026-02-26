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
import { AnalyticsQuery as AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsDto } from './dto/analytics.dto';

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
  getAll(@CurrentUser() host: HostDto) {
    return this.queuesService.getAll(host.id);
  }

  @AuthReq()
  @Get('analytics')
  getAnalytics(
    @CurrentUser() host: HostDto,
    @Query() { filter }: AnalyticsQueryDto,
  ): Promise<AnalyticsDto> {
    return this.queuesService.getAnalytics(host.id, filter);
  }

  @Get(':qrCode')
  getOnePublic(@Param('qrCode') qrCode: string) {
    return this.queuesService.getOnePublic(qrCode);
  }

  @AuthReq()
  @Get(':id/manage')
  getOneManage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.queuesService.getOneManage(id, host.id);
  }

  @Get(':qrCode/check-entry')
  async checkExistingEntry(
    @Param('qrCode') qrCode: string,
    @Query('token', ParseUUIDPipe) token?: string,
  ) {
    return this.entriesService.checkExistingEntry(qrCode, token);
  }

  @Post(':qrCode/join')
  joinQueue(@Param('qrCode') qrCode: string, @Body() dto: JoinQueueDto = {}) {
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
}
