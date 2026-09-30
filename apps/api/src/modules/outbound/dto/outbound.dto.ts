import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { OutboundTarget } from '@prisma/client';

export class CreateOutboundDto {
  @IsString()
  eventId!: string;

  @IsEnum(OutboundTarget)
  target!: OutboundTarget;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @MinLength(1)
  bodyHtml!: string;

  @IsOptional()
  @IsBoolean()
  send?: boolean;
}

export class UpdateOutboundDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  bodyHtml?: string;
}
