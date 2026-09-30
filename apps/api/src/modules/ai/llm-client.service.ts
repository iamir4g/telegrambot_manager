import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CryptoService } from '../../shared/crypto/crypto.service';

@Injectable()
export class LlmClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async getClient(eventId: string) {
    const settings = await this.prisma.llmSettings.findUnique({
      where: { eventId },
    });
    const apiKey =
      this.crypto.decrypt(settings?.apiKeyEncrypted ?? '') ||
      process.env.OPENAI_API_KEY ||
      '';
    const baseURL = settings?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    if (!apiKey) return null;
    return {
      client: new OpenAI({ apiKey, baseURL }),
      settings: settings ?? {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.2,
        systemPrompt:
          'تو دستیار رسمی رویداد فیناپ هستی. فقط از اطلاعات تأییدشده در context استفاده کن. حدس نزن.',
      },
    };
  }

  async complete(eventId: string, userPrompt: string, context: string) {
    const pack = await this.getClient(eventId);
    if (!pack) {
      return {
        ok: false as const,
        reason: 'llm_not_configured' as const,
        text: '',
      };
    }
    try {
      const completion = await pack.client.chat.completions.create({
        model: pack.settings.model,
        temperature: pack.settings.temperature,
        max_tokens: pack.settings.maxTokens,
        messages: [
          { role: 'system', content: pack.settings.systemPrompt },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion:\n${userPrompt}\n\nاگر در context جواب قطعی نیست بگو اطلاعات کافی نیست.`,
          },
        ],
      });
      return {
        ok: true as const,
        text: completion.choices[0]?.message?.content?.trim() ?? '',
      };
    } catch {
      return {
        ok: false as const,
        reason: 'llm_error' as const,
        text: '',
      };
    }
  }
}
