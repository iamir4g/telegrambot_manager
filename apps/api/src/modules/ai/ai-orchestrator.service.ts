import { Injectable } from '@nestjs/common';
import { EscalationType } from '@prisma/client';
import { KnowledgeRetrievalService } from '../knowledge/knowledge-retrieval.service';
import { LlmClientService } from './llm-client.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EscalationsService } from '../escalations/escalations.service';

export type BotAnswerInput = {
  eventId: string;
  telegramUserId: string;
  username?: string;
  text: string;
  /** پنل پیش‌نمایش — kill switch بات را نادیده بگیر */
  bypassBotEnabledCheck?: boolean;
};

@Injectable()
export class AiOrchestratorService {
  constructor(
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly llm: LlmClientService,
    private readonly prisma: PrismaService,
    private readonly escalations: EscalationsService,
  ) {}

  async answer(input: BotAnswerInput) {
    const settings = await this.prisma.telegramSettings.findUnique({
      where: { eventId: input.eventId },
    });

    let conversation = await this.prisma.conversation.findFirst({
      where: { eventId: input.eventId, telegramUserId: input.telegramUserId },
      orderBy: { createdAt: 'desc' },
    });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          eventId: input.eventId,
          telegramUserId: input.telegramUserId,
          username: input.username ?? '',
        },
      });
    } else if (input.username) {
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { username: input.username },
      });
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: input.text,
      },
    });

    if (settings && !settings.isEnabled && !input.bypassBotEnabledCheck) {
      const text = settings.errorMessage || 'بات فعلاً غیرفعال است.';
      await this.saveAssistant(conversation.id, text);
      return { text, escalated: false, topicKey: null };
    }

    const topicKey = await this.retrieval.classifyTopic(input.eventId, input.text);
    if (!topicKey) {
      await this.escalations.create({
        eventId: input.eventId,
        type: EscalationType.UNANSWERED,
        telegramUserId: input.telegramUserId,
        username: input.username ?? '',
        subject: 'سؤال خارج از محدوده موضوعات',
        body: input.text,
      });
      const text =
        settings?.outOfScopeMessage ??
        'این موضوع خارج از محدوده اطلاعات رویداد است.';
      await this.saveAssistant(conversation.id, text);
      return { text, escalated: true, topicKey: null };
    }

    const chunks = await this.retrieval.retrieve(
      input.eventId,
      input.text,
      topicKey,
    );
    const context = chunks
      .map((c, i) => `[${i + 1}] (${c.type}) ${c.title}\n${c.body}`)
      .join('\n\n');

    if (!context.trim()) {
      await this.escalations.create({
        eventId: input.eventId,
        type: EscalationType.UNANSWERED,
        telegramUserId: input.telegramUserId,
        username: input.username ?? '',
        subject: `بی‌پاسخ — موضوع ${topicKey}`,
        body: input.text,
      });
      const text = settings?.escalateMessage ?? 'درخواست شما ثبت شد.';
      await this.saveAssistant(conversation.id, text, topicKey);
      return { text, escalated: true, topicKey };
    }

    const llmResult = await this.llm.complete(input.eventId, input.text, context);
    let text = llmResult.text;
    let escalated = false;

    if (!llmResult.ok || !text) {
      text = chunks
        .filter((c) => c.type === 'faq')
        .slice(0, 2)
        .map((c) => `${c.title}\n${c.body}`)
        .join('\n\n');
      if (!text) {
        text = settings?.escalateMessage ?? 'اطلاعات کافی برای پاسخ قطعی نداریم.';
        escalated = true;
        await this.escalations.create({
          eventId: input.eventId,
          type: EscalationType.UNANSWERED,
          telegramUserId: input.telegramUserId,
          username: input.username ?? '',
          subject: `بی‌پاسخ — موضوع ${topicKey}`,
          body: input.text,
        });
      }
    } else if (/اطلاعات کافی|نمی‌دانم|مطمئن نیستم|ندارم/i.test(text)) {
      escalated = true;
      await this.escalations.create({
        eventId: input.eventId,
        type: EscalationType.UNANSWERED,
        telegramUserId: input.telegramUserId,
        username: input.username ?? '',
        subject: `نیاز به پیگیری — موضوع ${topicKey}`,
        body: `${input.text}\n---\nپاسخ مدل: ${text}`,
      });
      text = `${text}\n\n${settings?.escalateMessage ?? ''}`.trim();
    }

    await this.saveAssistant(conversation.id, text, topicKey);
    return { text, escalated, topicKey };
  }

  private saveAssistant(
    conversationId: string,
    content: string,
    topicKey?: string | null,
  ) {
    return this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content,
        topicKey: topicKey ?? undefined,
      },
    });
  }
}
