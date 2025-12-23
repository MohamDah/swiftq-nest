export enum QueueEventType {
  ENTRY_JOINED = 'ENTRY_JOINED',
  QUEUE_ADVANCED = 'QUEUE_ADVANCED',
  QUEUE_UPDATED = 'QUEUE_UPDATED',
}

export enum EntryEventType {
  QUEUE_ADVANCED = 'QUEUE_ADVANCED',
  CALL = 'CALL',
}

export interface QueueUpdatedPayload {
  queueId: string;
  type: QueueEventType;
  data?: {
    currentSize?: number;
    estimatedWaitTime?: number;
  };
}

export interface EntryUpdatedPayload {
  qrCode: string;
  sessionToken?: string;
  type: EntryEventType;
  data?: {
    displayNumber?: string;
  };
}
