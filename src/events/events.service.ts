import { Injectable } from '@nestjs/common';
import {
  EVENT_NAMES,
  QueueUpdatedPayload,
  EntryUpdatedPayload,
  QueueEventType,
  EntryEventType,
} from 'src/shared/events';
import { QueueGateway } from './gateways/queue.gateway';
import { EntryGateway } from './gateways/entry.gateway';

@Injectable()
export class EventsService {
  constructor(
    private readonly queueGateway: QueueGateway,
    private readonly entryGateway: EntryGateway,
  ) {}

  emitQueueUpdate(payload: QueueUpdatedPayload): void {
    this.queueGateway.server
      .to(`queue:${payload.queueId}`)
      .emit(EVENT_NAMES.QUEUE_UPDATE, { type: payload.type, ...payload.data });
  }

  emitEntryUpdate(payload: EntryUpdatedPayload): void {
    let room = `entry:${payload.qrCode}`;

    if (payload.sessionToken) room += `:${payload.sessionToken}`;

    this.entryGateway.server
      .to(room)
      .emit(EVENT_NAMES.ENTRY_UPDATE, { type: payload.type, ...payload.data });
  }

  emitEntryJoined(queueId: string, data?: QueueUpdatedPayload['data']): void {
    this.emitQueueUpdate({
      queueId,
      type: QueueEventType.ENTRY_JOINED,
      data,
    });
  }

  emitQueueAdvanced(
    queueId: string,
    qrCode: string,
    data?: {
      queue?: QueueUpdatedPayload['data'];
      entry?: EntryUpdatedPayload['data'];
    },
  ): void {
    this.emitQueueUpdate({
      queueId,
      type: QueueEventType.QUEUE_ADVANCED,
      data: data?.queue,
    });

    this.emitEntryUpdate({
      qrCode,
      type: EntryEventType.QUEUE_ADVANCED,
      data: data?.entry,
    });
  }

  emitEntryCall(
    qrCode: string,
    sessionToken: string,
    data?: EntryUpdatedPayload['data'],
  ): void {
    this.emitEntryUpdate({
      qrCode,
      sessionToken,
      type: EntryEventType.CALL,
      data,
    });
  }
}
