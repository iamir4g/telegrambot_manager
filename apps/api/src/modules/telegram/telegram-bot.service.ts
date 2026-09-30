import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EscalationType, TelegramMode } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TelegramSettingsService } from './telegram-settings.service';
import { TelegramSenderService } from './telegram-sender.service';
import { TelegramMenuService } from './telegram-menu.service';
import { AiOrchestratorService } from '../ai/ai-orchestrator.service';
import { EscalationsService } from '../escalations/escalations.service';
import { MENU, faqInlineKeyboard } from './telegram-keyboards';

type TgUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: { id: number; username?: string; first_name?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number; username?: string; first_name?: string };
    message?: {
      message_id: number;
      chat: { id: number };
      text?: string;
    };
  };
};

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private polling = false;
  private offset = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: TelegramSettingsService,
    private readonly sender: TelegramSenderService,
    private readonly menu: TelegramMenuService,
    private readonly ai: AiOrchestratorService,
    private readonly escalations: EscalationsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.ensurePolling();
    }, 5000);
    void this.ensurePolling();
  }

  onModuleDestroy() {
    this.polling = false;
    if (this.timer) clearInterval(this.timer);
  }

  async handleUpdate(eventId: string, update: TgUpdate) {
    if (update.callback_query) {
      await this.handleCallback(eventId, update.callback_query);
      return;
    }

    const message = update.message;
    if (!message?.text || !message.from) return;

    const text = message.text.trim();
    const chatId = message.chat.id;
    const telegramUserId = String(message.from.id);
    const username = message.from.username ?? message.from.first_name ?? '';

    const tg = await this.prisma.telegramSettings.findUnique({
      where: { eventId },
    });
    if (!tg) return;

    if (text === '/start' || text === MENU.HOME) {
      await this.sender.sendMessage(
        eventId,
        chatId,
        tg.startMessage,
        this.menu.mainKeyboard(),
      );
      await this.sender.sendMessage(
        eventId,
        chatId,
        tg.optInPrompt,
        this.menu.optInKeyboard(),
      );
      return;
    }

    if (text === MENU.FAQ) {
      const pack = await this.menu.buildFaqKeyboard(eventId, 0);
      await this.sender.sendMessage(
        eventId,
        chatId,
        pack.text,
        pack.reply_markup,
      );
      return;
    }

    if (text === MENU.SCHEDULE) {
      const summary = await this.menu.scheduleSummary(eventId);
      await this.sender.sendMessage(
        eventId,
        chatId,
        summary,
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (text === MENU.REGISTER) {
      const link = await this.menu.getRegistrationLink(eventId);
      if (link?.url) {
        await this.sender.sendMessage(
          eventId,
          chatId,
          `برای ثبت‌نام از لینک زیر استفاده کنید:\n<a href="${link.url}">${link.label || 'ثبت‌نام'}</a>`,
          this.menu.mainKeyboard(),
        );
      } else {
        await this.sender.sendMessage(
          eventId,
          chatId,
          'لینک ثبت‌نام هنوز در پنل تنظیم نشده است. اگر مشکل دارید پشتیبانی را بزنید.',
          this.menu.mainKeyboard(),
        );
      }
      return;
    }

    if (text === MENU.SUPPORT) {
      await this.escalations.create({
        eventId,
        type: EscalationType.OTHER,
        telegramUserId,
        username,
        subject: 'درخواست پشتیبانی از منوی بات',
        body: 'کاربر دکمه پشتیبانی را زد.',
      });
      await this.sender.sendMessage(
        eventId,
        chatId,
        `${tg.escalateMessage}\n\nمی‌توانید مشکل را همین‌جا بنویسید.`,
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (text === 'بله' || text === '/optin') {
      await this.saveOptIn(telegramUserId, username, true);
      await this.sender.sendMessage(
        eventId,
        chatId,
        'عضویت شما برای دریافت پیام‌های مهم ثبت شد.',
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (text.startsWith('/sponsor') || /اسپانسر|حمایت مالی/i.test(text)) {
      await this.escalations.create({
        eventId,
        type: EscalationType.SPONSORSHIP,
        telegramUserId,
        username,
        subject: 'درخواست اسپانسرشیپ',
        body: text,
      });
      await this.sender.sendMessage(
        eventId,
        chatId,
        tg.escalateMessage,
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (
      /مشکل بلیت|ثبت‌نام|ثبت نام/i.test(text) &&
      /مشکل|خطا|نمیشه|نمی‌شود/i.test(text)
    ) {
      await this.escalations.create({
        eventId,
        type: EscalationType.TICKET_ISSUE,
        telegramUserId,
        username,
        subject: 'مشکل بلیت/ثبت‌نام',
        body: text,
      });
      await this.sender.sendMessage(
        eventId,
        chatId,
        tg.escalateMessage,
        this.menu.mainKeyboard(),
      );
      return;
    }

    try {
      const result = await this.ai.answer({
        eventId,
        telegramUserId,
        username,
        text,
      });
      await this.sender.sendMessage(
        eventId,
        chatId,
        result.text,
        this.menu.mainKeyboard(),
      );
    } catch (err) {
      this.logger.error(err);
      await this.sender.sendMessage(
        eventId,
        chatId,
        tg.errorMessage,
        this.menu.mainKeyboard(),
      );
    }
  }

  private async handleCallback(
    eventId: string,
    cb: NonNullable<TgUpdate['callback_query']>,
  ) {
    const data = cb.data ?? '';
    const chatId = cb.message?.chat.id;
    const telegramUserId = String(cb.from.id);
    const username = cb.from.username ?? cb.from.first_name ?? '';
    if (!chatId) {
      await this.sender.answerCallbackQuery(eventId, cb.id);
      return;
    }

    const tg = await this.prisma.telegramSettings.findUnique({
      where: { eventId },
    });

    if (data === 'optin:yes') {
      await this.saveOptIn(telegramUserId, username, true);
      await this.sender.answerCallbackQuery(eventId, cb.id, 'ثبت شد');
      await this.sender.sendMessage(
        eventId,
        chatId,
        'عضویت شما برای دریافت پیام‌های مهم ثبت شد.',
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (data === 'optin:no') {
      await this.saveOptIn(telegramUserId, username, false);
      await this.sender.answerCallbackQuery(eventId, cb.id, 'باشه');
      await this.sender.sendMessage(
        eventId,
        chatId,
        'اشکالی ندارد. هر وقت خواستید از منوی بات دوباره عضو شوید.',
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (data === 'faq:ask') {
      await this.sender.answerCallbackQuery(eventId, cb.id);
      await this.sender.sendMessage(
        eventId,
        chatId,
        'سؤالتان را همین‌جا بنویسید؛ سعی می‌کنم از اطلاعات تأییدشده رویداد جواب بدهم.',
        this.menu.mainKeyboard(),
      );
      return;
    }

    if (data.startsWith('faqpage:')) {
      const page = Number(data.split(':')[1] || 0);
      const faqs = await this.menu.listApprovedFaqs(eventId);
      await this.sender.answerCallbackQuery(eventId, cb.id);
      if (cb.message?.message_id) {
        try {
          await this.sender.editMessageText(
            eventId,
            chatId,
            cb.message.message_id,
            'یکی از سؤالات متداول را انتخاب کنید:',
            faqInlineKeyboard(faqs, page),
          );
          return;
        } catch {
          /* fall through to new message */
        }
      }
      await this.sender.sendMessage(
        eventId,
        chatId,
        'یکی از سؤالات متداول را انتخاب کنید:',
        faqInlineKeyboard(faqs, page),
      );
      return;
    }

    if (data.startsWith('faq:')) {
      const faqId = data.slice(4);
      const faq = await this.menu.getFaqAnswer(eventId, faqId);
      await this.sender.answerCallbackQuery(eventId, cb.id);
      if (!faq) {
        await this.sender.sendMessage(
          eventId,
          chatId,
          tg?.errorMessage || 'این سؤال دیگر در دسترس نیست.',
          this.menu.mainKeyboard(),
        );
        return;
      }
      await this.sender.sendMessage(
        eventId,
        chatId,
        `<b>${faq.question}</b>\n\n${faq.answer}`,
        this.menu.mainKeyboard(),
      );
      return;
    }

    await this.sender.answerCallbackQuery(eventId, cb.id);
  }

  private saveOptIn(telegramUserId: string, username: string, optedIn: boolean) {
    return this.prisma.audienceConsent.upsert({
      where: { telegramUserId },
      create: { telegramUserId, username, optedIn },
      update: { optedIn, username },
    });
  }

  private async ensurePolling() {
    if (this.polling) return;
    const event = await this.prisma.event.findFirst({
      where: { isActive: true },
      include: { telegram: true },
    });
    if (
      !event?.telegram ||
      !event.telegram.isEnabled ||
      event.telegram.mode !== TelegramMode.LONG_POLLING
    ) {
      return;
    }
    const token = await this.settings.getRawToken(event.id);
    if (!token) return;

    this.polling = true;
    try {
      await this.pollOnce(event.id, token);
    } catch (err) {
      this.logger.warn(`Polling error: ${String(err)}`);
    } finally {
      this.polling = false;
    }
  }

  private async pollOnce(eventId: string, token: string) {
    const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
    url.searchParams.set('timeout', '20');
    url.searchParams.set('offset', String(this.offset));
    // ensure callback_query is delivered
    url.searchParams.set(
      'allowed_updates',
      JSON.stringify(['message', 'callback_query']),
    );
    const res = await fetch(url, { method: 'GET' });
    const json = (await res.json()) as { ok: boolean; result?: TgUpdate[] };
    if (!json.ok || !json.result?.length) return;
    for (const update of json.result) {
      this.offset = update.update_id + 1;
      await this.handleUpdate(eventId, update);
    }
  }
}
