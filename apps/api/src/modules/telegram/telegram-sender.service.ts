import { Injectable, Logger } from '@nestjs/common';
import { TelegramSettingsService } from './telegram-settings.service';
import type { ReplyMarkup } from './telegram-keyboards';

type TelegramMessageResult = {
  message_id: number;
  chat: { id: number };
};

@Injectable()
export class TelegramSenderService {
  private readonly logger = new Logger(TelegramSenderService.name);

  constructor(private readonly settings: TelegramSettingsService) {}

  async callApi(eventId: string, method: string, body: Record<string, unknown>) {
    const token = await this.settings.getRawToken(eventId);
    if (!token) {
      throw new Error('توکن بات تنظیم نشده است');
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: unknown;
    };
    if (!json.ok) {
      this.logger.warn(`Telegram API ${method} failed: ${json.description}`);
      throw new Error(json.description || 'خطای تلگرام');
    }
    return json.result;
  }

  async sendMessage(
    eventId: string,
    chatId: string | number,
    text: string,
    replyMarkup?: ReplyMarkup,
    options?: { disableWebPagePreview?: boolean },
  ): Promise<TelegramMessageResult> {
    return this.callApi(eventId, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: options?.disableWebPagePreview ?? false,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }) as Promise<TelegramMessageResult>;
  }

  async answerCallbackQuery(
    eventId: string,
    callbackQueryId: string,
    text?: string,
  ) {
    return this.callApi(eventId, 'answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {}),
    });
  }

  async editMessageText(
    eventId: string,
    chatId: string | number,
    messageId: string | number,
    text: string,
    replyMarkup?: ReplyMarkup,
  ) {
    return this.callApi(eventId, 'editMessageText', {
      chat_id: chatId,
      message_id: Number(messageId),
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  }

  async deleteMessage(
    eventId: string,
    chatId: string | number,
    messageId: string | number,
  ) {
    return this.callApi(eventId, 'deleteMessage', {
      chat_id: chatId,
      message_id: Number(messageId),
    });
  }

  async getMe(eventId: string) {
    return this.callApi(eventId, 'getMe', {}) as Promise<{
      id: number;
      username?: string;
      first_name?: string;
    }>;
  }

  async testChannel(eventId: string) {
    const settings = await this.settings.get(eventId);
    if (!settings.channelChatId) {
      throw new Error('شناسه کانال تنظیم نشده است');
    }
    return this.sendMessage(
      eventId,
      settings.channelChatId,
      '✅ تست اتصال کانال از پنل فیناپ',
    );
  }
}
