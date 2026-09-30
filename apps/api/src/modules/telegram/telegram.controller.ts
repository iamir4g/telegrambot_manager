import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { TelegramSettingsService } from './telegram-settings.service';
import { TelegramSenderService } from './telegram-sender.service';
import { TelegramBotService } from './telegram-bot.service';
import { UpdateTelegramSettingsDto } from './dto/telegram-settings.dto';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly settings: TelegramSettingsService,
    private readonly sender: TelegramSenderService,
    private readonly bot: TelegramBotService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('settings/:eventId')
  getSettings(@Param('eventId') eventId: string) {
    return this.settings.get(eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('settings/:eventId')
  updateSettings(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateTelegramSettingsDto,
  ) {
    return this.settings.update(eventId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('settings/:eventId/test-bot')
  async testBot(@Param('eventId') eventId: string) {
    const me = await this.sender.getMe(eventId);
    await this.settings.updateBotIdentity(
      eventId,
      String(me.id),
      me.username ?? '',
    );
    return { ok: true, bot: me };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('settings/:eventId/test-channel')
  async testChannel(@Param('eventId') eventId: string) {
    await this.sender.testChannel(eventId);
    return { ok: true };
  }

  /** Webhook endpoint — public, validated later by secret if configured */
  @Post('webhook/:eventId')
  async webhook(
    @Param('eventId') eventId: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.bot.handleUpdate(eventId, body as never);
    return { ok: true };
  }
}
