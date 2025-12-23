export const EVENT_NAMES = {
  QUEUE_UPDATED: 'queue.updated',
  ENTRY_UPDATED: 'entry.updated',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];
