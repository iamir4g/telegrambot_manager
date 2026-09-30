import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CryptoModule } from './shared/crypto/crypto.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AiModule } from './modules/ai/ai.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { EscalationsModule } from './modules/escalations/escalations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OutboundModule } from './modules/outbound/outbound.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CryptoModule,
    AuthModule,
    UsersModule,
    EventsModule,
    KnowledgeModule,
    AiModule,
    TelegramModule,
    EscalationsModule,
    ReportsModule,
    OutboundModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
