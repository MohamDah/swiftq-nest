import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { QueuesService } from './queues.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CreateQueueDto } from './dto/create-queue.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';
import { JoinQueueDto } from './dto/join-queue.dto';

@Controller('queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

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
  findOne(@Param('qrCode') qrCode: string) {
    return this.queuesService.findOne(qrCode);
  }

  @Post(':qrCode/join')
  joinQueue(@Param('qrCode') qrCode: string, @Body() dto: JoinQueueDto) {
    return this.queuesService.joinQueue(dto, qrCode);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() host: HostDto) {
    return this.queuesService.delete(id, host.id);
  }
}
