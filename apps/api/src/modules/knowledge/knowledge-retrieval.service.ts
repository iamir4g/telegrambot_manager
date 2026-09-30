import { Injectable } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { TopicsService } from './topics.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type RetrievedChunk = {
  type: 'faq' | 'session' | 'location' | 'link' | 'day_guide';
  title: string;
  body: string;
  topicKey?: string;
};

@Injectable()
export class KnowledgeRetrievalService {
  constructor(
    private readonly faqs: FaqsService,
    private readonly topics: TopicsService,
    private readonly prisma: PrismaService,
  ) {}

  async classifyTopic(eventId: string, question: string): Promise<string | null> {
    const topics = await this.topics.list(eventId);
    const normalized = question.toLowerCase();
    let best: { key: string; score: number } | null = null;

    for (const topic of topics) {
      const keywords = this.parseJsonArray(topic.keywordsJson);
      const samples = this.parseJsonArray(topic.sampleQuestions);
      let score = 0;
      for (const kw of [...keywords, topic.title, ...samples]) {
        const token = kw.toLowerCase().trim();
        if (!token) continue;
        if (normalized.includes(token)) score += token.length > 3 ? 2 : 1;
      }
      if (!best || score > best.score) best = { key: topic.key, score };
    }

    if (!best || best.score < 1) return null;
    return best.key;
  }

  async retrieve(eventId: string, question: string, topicKey: string | null) {
    const chunks: RetrievedChunk[] = [];
    const faqs = await this.faqs.listApproved(eventId);
    const q = question.toLowerCase();

    for (const faq of faqs) {
      if (topicKey && faq.topicKey && faq.topicKey !== topicKey) continue;
      const hay = `${faq.question} ${faq.answer}`.toLowerCase();
      const overlap = q
        .split(/\s+/)
        .filter((w) => w.length > 2 && hay.includes(w)).length;
      if (overlap > 0 || (topicKey && faq.topicKey === topicKey)) {
        chunks.push({
          type: 'faq',
          title: faq.question,
          body: faq.answer,
          topicKey: faq.topicKey || undefined,
        });
      }
    }

    if (chunks.length < 3) {
      for (const faq of faqs.slice(0, 5)) {
        if (chunks.some((c) => c.title === faq.question)) continue;
        chunks.push({
          type: 'faq',
          title: faq.question,
          body: faq.answer,
          topicKey: faq.topicKey || undefined,
        });
        if (chunks.length >= 6) break;
      }
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: { take: 8, orderBy: { sortOrder: 'asc' } },
        locations: true,
        links: true,
      },
    });

    if (event) {
      if (event.dayGuideJson && event.dayGuideJson !== '{}') {
        chunks.push({
          type: 'day_guide',
          title: 'راهنمای روز رویداد',
          body: event.dayGuideJson,
        });
      }
      for (const s of event.sessions) {
        chunks.push({
          type: 'session',
          title: s.title,
          body: `${s.description} | سالن: ${s.hall} | ${s.startsAt?.toISOString() ?? ''} - ${s.endsAt?.toISOString() ?? ''}`,
        });
      }
      for (const loc of event.locations) {
        chunks.push({
          type: 'location',
          title: loc.name,
          body: `${loc.address} | نقشه: ${loc.mapUrl} | ${loc.notes}`,
        });
      }
      for (const link of event.links) {
        chunks.push({
          type: 'link',
          title: link.label,
          body: link.url,
        });
      }
    }

    return chunks.slice(0, 12);
  }

  private parseJsonArray(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
}
