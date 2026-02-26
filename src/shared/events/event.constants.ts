export const EVENT_NAMES = {
  QUEUE_UPDATE: 'queue-update',
  ENTRY_UPDATE: 'entry-update',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];
