export type OutboundTarget = 'CHANNEL' | 'PRIVATE';

export type OutboundStatus =
  | 'DRAFT'
  | 'SENT'
  | 'EDITED'
  | 'DELETED'
  | 'FAILED';

export type OutboundDelivery = {
  id: string;
  chatId: string;
  telegramMessageId: string | null;
  status: string;
  error: string;
};

export type OutboundMessage = {
  id: string;
  eventId: string;
  target: OutboundTarget;
  title: string;
  bodyHtml: string;
  bodyTelegramHtml: string;
  status: OutboundStatus;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  deliveries: OutboundDelivery[];
};

export type OutboundFormValues = {
  title: string;
  bodyHtml: string;
};
