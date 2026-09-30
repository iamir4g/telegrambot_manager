import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, Roles, RolesGuard } from '../../shared/auth/guards';
import { CreateTopicDto, UpdateTopicDto } from './dto/knowledge.dto';
import { TopicsService } from './topics.service';

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Get()
  list(@Query('eventId') eventId: string) {
    return this.topics.list(eventId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: CreateTopicDto) {
    return this.topics.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topics.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.topics.remove(id);
  }
}
