import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TelegramMode } from '@prisma/client';

class QuickLinkDto {
  @IsString()
  label!: string;

  @IsString()
  url!: string;
}

export class UpdateTelegramSettingsDto {
  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsEnum(TelegramMode)
  mode?: TelegramMode;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  channelChatId?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  startMessage?: string;

  @IsOptional()
  @IsString()
  outOfScopeMessage?: string;

  @IsOptional()
  @IsString()
  escalateMessage?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsString()
  optInPrompt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickLinkDto)
  quickLinks?: QuickLinkDto[];
}
