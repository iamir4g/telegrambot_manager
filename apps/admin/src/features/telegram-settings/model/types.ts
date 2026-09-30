export type TelegramSettings = {
  eventId: string;
  botUsername: string;
  botId: string;
  mode: 'LONG_POLLING' | 'WEBHOOK';
  webhookUrl: string;
  channelChatId: string;
  isEnabled: boolean;
  startMessage: string;
  outOfScopeMessage: string;
  escalateMessage: string;
  errorMessage: string;
  optInPrompt: string;
  botTokenMasked: string;
  hasBotToken: boolean;
};

export type TelegramFormValues = {
  botToken: string;
  channelChatId: string;
  webhookUrl: string;
  mode: 'LONG_POLLING' | 'WEBHOOK';
  isEnabled: boolean;
  startMessage: string;
  outOfScopeMessage: string;
  escalateMessage: string;
  errorMessage: string;
  optInPrompt: string;
};
