export class QueueEventDto {
  queueId: string;
  type: 'ENTRY_JOINED' | 'STATUS_CHANGE' | 'QUEUE_ADVANCED';
}
