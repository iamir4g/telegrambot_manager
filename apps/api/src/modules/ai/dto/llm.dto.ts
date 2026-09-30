import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateLlmSettingsDto {
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  systemPrompt?: string;
}

export class PreviewAnswerDto {
  @IsString()
  eventId!: string;

  @IsString()
  @MinLength(2)
  text!: string;
}

export class CreateEscalationDto {
  @IsString()
  eventId!: string;

  @IsEnum(['UNANSWERED', 'TICKET_ISSUE', 'SPONSORSHIP', 'OTHER'])
  type!: 'UNANSWERED' | 'TICKET_ISSUE' | 'SPONSORSHIP' | 'OTHER';

  @IsOptional()
  @IsString()
  telegramUserId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;
}
