import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OutboundTarget, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { OutboundMessagesService } from './outbound-messages.service';
import { CreateOutboundDto, UpdateOutboundDto } from './dto/outbound.dto';

@Controller('outbound')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutboundController {
  constructor(private readonly outbound: OutboundMessagesService) {}

  @Get()
  list(
    @Query('eventId') eventId: string,
    @Query('target') target?: OutboundTarget,
  ) {
    return this.outbound.list(eventId, target);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.outbound.getById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(
    @Body() dto: CreateOutboundDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.outbound.create(dto, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOutboundDto) {
    return this.outbound.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.outbound.send(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.outbound.remove(id);
  }
}
