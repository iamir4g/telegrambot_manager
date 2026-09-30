import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { EscalationStatus, UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { EscalationsService } from './escalations.service';

class UpdateStatusDto {
  @IsEnum(EscalationStatus)
  status!: EscalationStatus;
}

@Controller('escalations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscalationsController {
  constructor(private readonly escalations: EscalationsService) {}

  @Get()
  list(@Query('eventId') eventId: string) {
    return this.escalations.list(eventId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.escalations.updateStatus(id, dto.status);
  }
}
