import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { OutboundMessagesService } from './outbound-messages.service';
import { OutboundController } from './outbound.controller';

@Module({
  imports: [TelegramModule],
  controllers: [OutboundController],
  providers: [OutboundMessagesService],
  exports: [OutboundMessagesService],
})
export class OutboundModule {}
