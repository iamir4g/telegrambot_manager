import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OutboundStatus, OutboundTarget } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TelegramSenderService } from '../telegram/telegram-sender.service';
import { TelegramSettingsService } from '../telegram/telegram-settings.service';
import {
  buildTelegramPayload,
  linkButtonsMarkup,
  sleep,
} from '../../shared/telegram-html';
import type { ReplyMarkup } from '../telegram/telegram-keyboards';
import { CreateOutboundDto, UpdateOutboundDto } from './dto/outbound.dto';

@Injectable()
export class OutboundMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: TelegramSenderService,
    private readonly telegramSettings: TelegramSettingsService,
  ) {}

  list(eventId: string, target?: OutboundTarget) {
    return this.prisma.outboundMessage.findMany({
      where: {
        eventId,
        ...(target ? { target } : {}),
        status: { not: OutboundStatus.DELETED },
      },
      include: {
        deliveries: {
          select: {
            id: true,
            chatId: true,
            telegramMessageId: true,
            status: true,
            error: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const item = await this.prisma.outboundMessage.findUnique({
      where: { id },
      include: { deliveries: true },
    });
    if (!item || item.status === OutboundStatus.DELETED) {
      throw new NotFoundException('پیام یافت نشد');
    }
    return item;
  }

  async create(dto: CreateOutboundDto, createdById?: string) {
    const payload = buildTelegramPayload(dto.bodyHtml);
    if (!payload.text.trim()) {
      throw new BadRequestException('متن پیام خالی است');
    }

    const message = await this.prisma.outboundMessage.create({
      data: {
        eventId: dto.eventId,
        target: dto.target,
        title: dto.title?.trim() || 'بدون عنوان',
        bodyHtml: dto.bodyHtml,
        bodyTelegramHtml: payload.text,
        status: OutboundStatus.DRAFT,
        createdById,
      },
    });

    if (dto.send) {
      return this.send(message.id);
    }

    return this.getById(message.id);
  }

  async update(id: string, dto: UpdateOutboundDto) {
    const existing = await this.getById(id);
    const bodyHtml = dto.bodyHtml ?? existing.bodyHtml;
    const payload = buildTelegramPayload(bodyHtml);
    if (!payload.text.trim()) {
      throw new BadRequestException('متن پیام خالی است');
    }

    await this.prisma.outboundMessage.update({
      where: { id },
      data: {
        title: dto.title?.trim() ?? existing.title,
        bodyHtml,
        bodyTelegramHtml: payload.text,
      },
    });

    const editableStatuses: OutboundStatus[] = [
      OutboundStatus.SENT,
      OutboundStatus.EDITED,
    ];
    if (editableStatuses.includes(existing.status)) {
      await this.editOnTelegram(id, bodyHtml);
      await this.prisma.outboundMessage.update({
        where: { id },
        data: { status: OutboundStatus.EDITED },
      });
    }

    return this.getById(id);
  }

  async send(id: string) {
    const message = await this.getById(id);
    if (
      message.status !== OutboundStatus.DRAFT &&
      message.status !== OutboundStatus.FAILED
    ) {
      throw new BadRequestException('فقط پیش‌نویس یا ناموفق قابل ارسال است');
    }

    const chatIds = await this.resolveChatIds(message.eventId, message.target);
    if (chatIds.length === 0) {
      await this.prisma.outboundMessage.update({
        where: { id },
        data: { status: OutboundStatus.FAILED },
      });
      throw new BadRequestException(
        message.target === OutboundTarget.CHANNEL
          ? 'شناسه کانال تنظیم نشده است'
          : 'کاربر opt-in وجود ندارد',
      );
    }

    const payload = buildTelegramPayload(message.bodyHtml);
    if (payload.text !== message.bodyTelegramHtml) {
      await this.prisma.outboundMessage.update({
        where: { id },
        data: { bodyTelegramHtml: payload.text },
      });
    }
    const replyMarkup = linkButtonsMarkup(payload.linkButtons) as
      | ReplyMarkup
      | undefined;

    let successCount = 0;
    for (const chatId of chatIds) {
      try {
        const result = await this.sender.sendMessage(
          message.eventId,
          chatId,
          payload.text,
          replyMarkup,
          { disableWebPagePreview: Boolean(payload.linkButtons.length) },
        );
        await this.prisma.outboundDelivery.create({
          data: {
            outboundMessageId: id,
            chatId: String(chatId),
            telegramMessageId: String(result.message_id),
            status: 'sent',
          },
        });
        successCount += 1;
      } catch (err) {
        await this.prisma.outboundDelivery.create({
          data: {
            outboundMessageId: id,
            chatId: String(chatId),
            status: 'failed',
            error: err instanceof Error ? err.message : 'خطای ارسال',
          },
        });
      }
      if (message.target === OutboundTarget.PRIVATE) {
        await sleep(35);
      }
    }

    const status =
      successCount === 0 ? OutboundStatus.FAILED : OutboundStatus.SENT;

    await this.prisma.outboundMessage.update({
      where: { id },
      data: {
        status,
        sentAt: successCount > 0 ? new Date() : null,
      },
    });

    return this.getById(id);
  }

  async remove(id: string) {
    const message = await this.getById(id);
    const deliveries = message.deliveries.filter(
      (d) =>
        d.telegramMessageId && (d.status === 'sent' || d.status === 'edited'),
    );

    for (const delivery of deliveries) {
      try {
        await this.sender.deleteMessage(
          message.eventId,
          delivery.chatId,
          delivery.telegramMessageId!,
        );
        await this.prisma.outboundDelivery.update({
          where: { id: delivery.id },
          data: { status: 'deleted' },
        });
      } catch (err) {
        await this.prisma.outboundDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'delete_failed',
            error: err instanceof Error ? err.message : 'خطای حذف',
          },
        });
      }
      if (message.target === OutboundTarget.PRIVATE) {
        await sleep(35);
      }
    }

    await this.prisma.outboundMessage.update({
      where: { id },
      data: {
        status: OutboundStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    return { ok: true };
  }

  private async editOnTelegram(id: string, bodyHtml: string) {
    const message = await this.getById(id);
    const payload = buildTelegramPayload(bodyHtml);
    const replyMarkup = linkButtonsMarkup(payload.linkButtons) as
      | ReplyMarkup
      | undefined;
    const deliveries = message.deliveries.filter(
      (d) =>
        d.telegramMessageId && (d.status === 'sent' || d.status === 'edited'),
    );

    for (const delivery of deliveries) {
      try {
        await this.sender.editMessageText(
          message.eventId,
          delivery.chatId,
          delivery.telegramMessageId!,
          payload.text,
          replyMarkup,
        );
        await this.prisma.outboundDelivery.update({
          where: { id: delivery.id },
          data: { status: 'edited', error: '' },
        });
      } catch (err) {
        await this.prisma.outboundDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'edit_failed',
            error: err instanceof Error ? err.message : 'خطای ویرایش',
          },
        });
      }
      if (message.target === OutboundTarget.PRIVATE) {
        await sleep(35);
      }
    }
  }

  private async resolveChatIds(eventId: string, target: OutboundTarget) {
    if (target === OutboundTarget.CHANNEL) {
      const settings = await this.telegramSettings.get(eventId);
      return settings.channelChatId ? [settings.channelChatId] : [];
    }

    const consents = await this.prisma.audienceConsent.findMany({
      where: { optedIn: true },
      select: { telegramUserId: true },
    });
    return consents.map((c) => c.telegramUserId);
  }
}
