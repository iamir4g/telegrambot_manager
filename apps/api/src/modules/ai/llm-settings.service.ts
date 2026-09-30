import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CryptoService } from '../../shared/crypto/crypto.service';
import { UpdateLlmSettingsDto } from './dto/llm.dto';

@Injectable()
export class LlmSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async get(eventId: string) {
    const settings = await this.prisma.llmSettings.findUnique({
      where: { eventId },
    });
    if (!settings) throw new NotFoundException('تنظیمات LLM یافت نشد');
    const apiKey = this.crypto.decrypt(settings.apiKeyEncrypted);
    return {
      ...settings,
      apiKeyEncrypted: undefined,
      apiKeyMasked: this.crypto.maskSecret(apiKey),
      hasApiKey: Boolean(apiKey || process.env.OPENAI_API_KEY),
    };
  }

  async update(eventId: string, dto: UpdateLlmSettingsDto) {
    const existing = await this.prisma.llmSettings.findUnique({
      where: { eventId },
    });
    if (!existing) throw new NotFoundException('تنظیمات LLM یافت نشد');

    return this.prisma.llmSettings.update({
      where: { eventId },
      data: {
        baseUrl: dto.baseUrl ?? existing.baseUrl,
        model: dto.model ?? existing.model,
        maxTokens: dto.maxTokens ?? existing.maxTokens,
        temperature: dto.temperature ?? existing.temperature,
        systemPrompt: dto.systemPrompt ?? existing.systemPrompt,
        apiKeyEncrypted:
          dto.apiKey !== undefined && dto.apiKey !== ''
            ? this.crypto.encrypt(dto.apiKey)
            : existing.apiKeyEncrypted,
      },
    }).then(() => this.get(eventId));
  }
}
