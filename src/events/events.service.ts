import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EVENT_NAMES,
  QueueUpdatedPayload,
  EntryUpdatedPayload,
  QueueEventType,
  EntryEventType,
} from 'src/shared/events';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitQueueUpdate(payload: QueueUpdatedPayload): void {
    this.eventEmitter.emit(EVENT_NAMES.QUEUE_UPDATED, payload);
  }

  emitEntryUpdate(payload: EntryUpdatedPayload): void {
    this.eventEmitter.emit(EVENT_NAMES.ENTRY_UPDATED, payload);
  }

  // Convenience methods for common event patterns
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
    // Emit to both channels for queue advancement
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
