import { Module, forwardRef } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { EscalationsModule } from '../escalations/escalations.module';
import { LlmClientService } from './llm-client.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { LlmSettingsService } from './llm-settings.service';
import { AiController } from './ai.controller';

@Module({
  imports: [KnowledgeModule, forwardRef(() => EscalationsModule)],
  controllers: [AiController],
  providers: [LlmClientService, AiOrchestratorService, LlmSettingsService],
  exports: [AiOrchestratorService, LlmClientService],
})
export class AiModule {}
