export class EntryEventDto {
  qrCode: string;
  sessionToken?: string;
  type: 'QUEUE_ADVANCED' | 'STATUS_CHANGE' | 'CALL';
}
