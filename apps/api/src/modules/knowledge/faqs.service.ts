import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CreateFaqDto,
  CreateTopicDto,
  UpdateFaqDto,
  UpdateTopicDto,
} from './dto/knowledge.dto';

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  list(eventId: string) {
    return this.prisma.faqItem.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  listApproved(eventId: string) {
    return this.prisma.faqItem.findMany({
      where: { eventId, status: ContentStatus.APPROVED },
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(dto: CreateFaqDto, updatedBy?: string) {
    return this.prisma.faqItem.create({
      data: {
        eventId: dto.eventId,
        question: dto.question,
        answer: dto.answer,
        topicKey: dto.topicKey ?? '',
        status: dto.status ?? ContentStatus.DRAFT,
        sortOrder: dto.sortOrder ?? 0,
        updatedBy,
      },
    });
  }

  async update(id: string, dto: UpdateFaqDto, updatedBy?: string) {
    await this.ensureExists(id);
    return this.prisma.faqItem.update({
      where: { id },
      data: { ...dto, updatedBy },
    });
  }

  async approve(id: string, updatedBy?: string) {
    return this.update(id, { status: ContentStatus.APPROVED }, updatedBy);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.faqItem.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const item = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('سوال یافت نشد');
    return item;
  }
}
