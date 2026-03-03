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
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QueuesService } from './queues.service';
import { AuthReq } from 'src/shared/decorators/auth.decorator';
import { CreateQueueDto } from './dto/create-queue.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { HostDto } from 'src/auth/dto/host.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { EntriesService } from 'src/entries/entries.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsDto } from './dto/analytics.dto';

@ApiTags('queues')
@Controller('queues')
export class QueuesController {
  constructor(
    private readonly queuesService: QueuesService,
    private readonly entriesService: EntriesService,
  ) {}

  @ApiOperation({ summary: 'Create a new queue' })
  @ApiCreatedResponse({ description: 'Queue created successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to generate a unique QR code after multiple attempts',
  })
  @ApiBearerAuth()
  @AuthReq()
  @Post()
  create(@Body() dto: CreateQueueDto, @CurrentUser() host: HostDto) {
    return this.queuesService.create(dto, host.id);
  }

  @ApiOperation({ summary: 'Get all queues for the authenticated host' })
  @ApiOkResponse({ description: 'Returns a list of queues' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiBearerAuth()
  @AuthReq()
  @Get()
  getAll(@CurrentUser() host: HostDto) {
    return this.queuesService.getAll(host.id);
  }

  @ApiOperation({ summary: 'Get analytics for the authenticated host' })
  @ApiOkResponse({ description: 'Returns analytics data', type: AnalyticsDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiBearerAuth()
  @AuthReq()
  @Get('analytics')
  getAnalytics(
    @CurrentUser() host: HostDto,
    @Query() { filter }: AnalyticsQueryDto,
  ): Promise<AnalyticsDto> {
    return this.queuesService.getAnalytics(host.id, filter);
  }

  @ApiOperation({ summary: 'Get public queue info by QR code' })
  @ApiOkResponse({ description: 'Returns public queue details' })
  @ApiNotFoundResponse({ description: 'Queue not found' })
  @Get(':qrCode')
  getOnePublic(@Param('qrCode') qrCode: string) {
    return this.queuesService.getOnePublic(qrCode);
  }

  @ApiOperation({ summary: 'Get full queue management view' })
  @ApiOkResponse({ description: 'Returns full queue details for management' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiNotFoundResponse({
    description: 'Queue not found or does not belong to the authenticated host',
  })
  @ApiBearerAuth()
  @AuthReq()
  @Get(':id/manage')
  getOneManage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() host: HostDto,
  ) {
    return this.queuesService.getOneManage(id, host.id);
  }

  @ApiOperation({
    summary: 'Check if a token already has an active entry in a queue',
  })
  @ApiOkResponse({ description: 'Returns existing entry if found, or null' })
  @ApiNotFoundResponse({ description: 'Queue not found' })
  @ApiQuery({ name: 'token', required: false, type: String })
  @Get(':qrCode/check-entry')
  async checkExistingEntry(
    @Param('qrCode') qrCode: string,
    @Query('token', ParseUUIDPipe) token?: string,
  ) {
    return this.entriesService.checkExistingEntry(qrCode, token);
  }

  @ApiOperation({ summary: 'Join a queue by QR code' })
  @ApiCreatedResponse({ description: 'Entry created and token returned' })
  @ApiNotFoundResponse({ description: 'Queue not found' })
  @ApiBadRequestResponse({
    description:
      'Queue is inactive, at max capacity, or customerName is required but missing',
  })
  @Post(':qrCode/join')
  joinQueue(@Param('qrCode') qrCode: string, @Body() dto: JoinQueueDto = {}) {
    return this.entriesService.joinQueue(dto, qrCode);
  }

  @ApiOperation({ summary: 'Delete a queue' })
  @ApiOkResponse({ description: 'Queue deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiBadRequestResponse({
    description: 'Queue still has active customers',
  })
  @ApiNotFoundResponse({ description: 'Queue not found' })
  @ApiBearerAuth()
  @AuthReq()
  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() host: HostDto) {
    return this.queuesService.delete(id, host.id);
  }

  @ApiOperation({ summary: 'Update queue settings' })
  @ApiOkResponse({ description: 'Queue updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiNotFoundResponse({
    description: 'Queue not found or does not belong to the authenticated host',
  })
  @ApiBearerAuth()
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
