import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EventsService } from './events.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { IsObject, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

class DayGuideDto {
  @IsObject()
  dayGuide!: Record<string, unknown>;
}

class UpsertLinkDto {
  @IsString()
  @MinLength(1)
  key!: string;

  @IsString()
  label!: string;

  @IsString()
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  sortOrder?: number;
}

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.list();
  }

  @Get('active')
  getActive() {
    return this.events.getActive();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.events.getById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/day-guide')
  updateDayGuide(@Param('id') id: string, @Body() dto: DayGuideDto) {
    return this.events.updateDayGuide(id, dto.dayGuide);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Put(':id/links')
  upsertLink(@Param('id') id: string, @Body() dto: UpsertLinkDto) {
    return this.events.upsertLink(id, dto);
  }
}
