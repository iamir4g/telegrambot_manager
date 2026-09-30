import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EscalationsModule } from '../escalations/escalations.module';
import { TelegramSettingsService } from './telegram-settings.service';
import { TelegramSenderService } from './telegram-sender.service';
import { TelegramMenuService } from './telegram-menu.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [forwardRef(() => AiModule), EscalationsModule],
  controllers: [TelegramController],
  providers: [
    TelegramSettingsService,
    TelegramSenderService,
    TelegramMenuService,
    TelegramBotService,
  ],
  exports: [TelegramSettingsService, TelegramSenderService],
})
export class TelegramModule {}
