import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class CreateFaqDto {
  @IsString()
  eventId!: string;

  @IsString()
  @MinLength(2)
  question!: string;

  @IsString()
  @MinLength(2)
  answer!: string;

  @IsOptional()
  @IsString()
  topicKey?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  question?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  answer?: string;

  @IsOptional()
  @IsString()
  topicKey?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateTopicDto {
  @IsString()
  eventId!: string;

  @IsString()
  @MinLength(1)
  key!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  parentKey?: string;

  @IsOptional()
  keywords?: string[];

  @IsOptional()
  sampleQuestions?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  parentKey?: string;

  @IsOptional()
  keywords?: string[];

  @IsOptional()
  sampleQuestions?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
