import { Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  faqInlineKeyboard,
  mainReplyKeyboard,
  optInInlineKeyboard,
  type ReplyMarkup,
} from './telegram-keyboards';

@Injectable()
export class TelegramMenuService {
  constructor(private readonly prisma: PrismaService) {}

  mainKeyboard(): ReplyMarkup {
    return mainReplyKeyboard();
  }

  optInKeyboard(): ReplyMarkup {
    return optInInlineKeyboard();
  }

  async listApprovedFaqs(eventId: string) {
    return this.prisma.faqItem.findMany({
      where: { eventId, status: ContentStatus.APPROVED },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      select: { id: true, question: true, answer: true, topicKey: true },
    });
  }

  async buildFaqKeyboard(eventId: string, page = 0) {
    const faqs = await this.listApprovedFaqs(eventId);
    if (faqs.length === 0) {
      return {
        text: 'هنوز سؤال تأییدشده‌ای ثبت نشده است. سؤال خود را به‌صورت متنی بپرسید.',
        reply_markup: this.mainKeyboard(),
      };
    }
    return {
      text: 'یکی از سؤالات متداول را انتخاب کنید:',
      reply_markup: faqInlineKeyboard(faqs, page),
    };
  }

  async getFaqAnswer(eventId: string, faqId: string) {
    return this.prisma.faqItem.findFirst({
      where: {
        id: faqId,
        eventId,
        status: ContentStatus.APPROVED,
      },
    });
  }

  async getRegistrationLink(eventId: string) {
    const link = await this.prisma.eventLink.findUnique({
      where: { eventId_key: { eventId, key: 'registration' } },
    });
    if (link?.url) return link;

    const settings = await this.prisma.telegramSettings.findUnique({
      where: { eventId },
    });
    if (!settings?.quickLinksJson) return null;
    try {
      const parsed = JSON.parse(settings.quickLinksJson) as Array<{
        label?: string;
        url?: string;
      }>;
      const found = parsed.find((x) =>
        /ثبت|register|ticket/i.test(`${x.label ?? ''} ${x.url ?? ''}`),
      );
      if (found?.url) {
        return { label: found.label || 'ثبت‌نام', url: found.url };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  async scheduleSummary(eventId: string) {
    const faqs = await this.prisma.faqItem.findMany({
      where: {
        eventId,
        status: ContentStatus.APPROVED,
        topicKey: 'schedule',
      },
      orderBy: { sortOrder: 'asc' },
      take: 3,
    });
    if (faqs.length) {
      return faqs.map((f) => `<b>${f.question}</b>\n${f.answer}`).join('\n\n');
    }

    const sessions = await this.prisma.session.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
      take: 8,
    });
    if (!sessions.length) {
      return 'برنامه هنوز در پنل ثبت نشده است. جزئیات را بپرسید یا بعداً سر بزنید.';
    }
    return sessions
      .map((s) => {
        const time = s.startsAt
          ? new Date(s.startsAt).toLocaleString('fa-IR')
          : '';
        return `• <b>${s.title}</b>${s.hall ? ` — ${s.hall}` : ''}${time ? `\n${time}` : ''}`;
      })
      .join('\n\n');
  }
}
