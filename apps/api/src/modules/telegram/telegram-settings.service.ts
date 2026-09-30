import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CryptoService } from '../../shared/crypto/crypto.service';
import { UpdateTelegramSettingsDto } from './dto/telegram-settings.dto';

@Injectable()
export class TelegramSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async get(eventId: string) {
    const settings = await this.prisma.telegramSettings.findUnique({
      where: { eventId },
    });
    if (!settings) throw new NotFoundException('تنظیمات تلگرام یافت نشد');
    const token = this.crypto.decrypt(settings.botTokenEncrypted);
    return {
      id: settings.id,
      eventId: settings.eventId,
      botUsername: settings.botUsername,
      botId: settings.botId,
      mode: settings.mode,
      webhookUrl: settings.webhookUrl,
      channelChatId: settings.channelChatId,
      isEnabled: settings.isEnabled,
      startMessage: settings.startMessage,
      outOfScopeMessage: settings.outOfScopeMessage,
      escalateMessage: settings.escalateMessage,
      errorMessage: settings.errorMessage,
      optInPrompt: settings.optInPrompt,
      quickLinks: this.parseLinks(settings.quickLinksJson),
      botTokenMasked: this.crypto.maskSecret(token),
      hasBotToken: Boolean(token),
      updatedAt: settings.updatedAt,
    };
  }

  async getRawToken(eventId: string) {
    const settings = await this.prisma.telegramSettings.findUnique({
      where: { eventId },
    });
    if (!settings) return '';
    return this.crypto.decrypt(settings.botTokenEncrypted);
  }

  async update(eventId: string, dto: UpdateTelegramSettingsDto) {
    const existing = await this.prisma.telegramSettings.findUnique({
      where: { eventId },
    });
    if (!existing) throw new NotFoundException('تنظیمات تلگرام یافت نشد');

    await this.prisma.telegramSettings.update({
      where: { eventId },
      data: {
        mode: dto.mode ?? existing.mode,
        webhookUrl: dto.webhookUrl ?? existing.webhookUrl,
        channelChatId: dto.channelChatId ?? existing.channelChatId,
        isEnabled: dto.isEnabled ?? existing.isEnabled,
        startMessage: dto.startMessage ?? existing.startMessage,
        outOfScopeMessage: dto.outOfScopeMessage ?? existing.outOfScopeMessage,
        escalateMessage: dto.escalateMessage ?? existing.escalateMessage,
        errorMessage: dto.errorMessage ?? existing.errorMessage,
        optInPrompt: dto.optInPrompt ?? existing.optInPrompt,
        quickLinksJson:
          dto.quickLinks !== undefined
            ? JSON.stringify(dto.quickLinks)
            : existing.quickLinksJson,
        botTokenEncrypted:
          dto.botToken !== undefined && dto.botToken !== ''
            ? this.crypto.encrypt(dto.botToken)
            : existing.botTokenEncrypted,
      },
    });

    return this.get(eventId);
  }

  async updateBotIdentity(eventId: string, botId: string, botUsername: string) {
    return this.prisma.telegramSettings.update({
      where: { eventId },
      data: { botId, botUsername },
    });
  }

  private parseLinks(raw: string) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
