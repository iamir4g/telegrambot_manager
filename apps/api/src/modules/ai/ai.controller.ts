import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { LlmSettingsService } from './llm-settings.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { PreviewAnswerDto, UpdateLlmSettingsDto } from './dto/llm.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly llmSettings: LlmSettingsService,
    private readonly orchestrator: AiOrchestratorService,
  ) {}

  @Get('settings/:eventId')
  getSettings(@Param('eventId') eventId: string) {
    return this.llmSettings.get(eventId);
  }

  @Roles(UserRole.ADMIN)
  @Patch('settings/:eventId')
  updateSettings(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateLlmSettingsDto,
  ) {
    return this.llmSettings.update(eventId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post('preview')
  preview(@Body() dto: PreviewAnswerDto) {
    return this.orchestrator.answer({
      eventId: dto.eventId,
      telegramUserId: 'preview-admin',
      username: 'admin-preview',
      text: dto.text,
      bypassBotEnabledCheck: true,
    });
  }
}
