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
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { CreateFaqDto, UpdateFaqDto } from './dto/knowledge.dto';
import { FaqsService } from './faqs.service';

@Controller('faqs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  list(@Query('eventId') eventId: string) {
    return this.faqs.list(eventId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(
    @Body() dto: CreateFaqDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.faqs.create(dto, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.faqs.update(id, dto, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.faqs.approve(id, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.faqs.remove(id);
  }
}
