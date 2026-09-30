import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/knowledge.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  list(eventId: string) {
    return this.prisma.topicNode.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(dto: CreateTopicDto) {
    return this.prisma.topicNode.create({
      data: {
        eventId: dto.eventId,
        key: dto.key,
        title: dto.title,
        parentKey: dto.parentKey,
        keywordsJson: JSON.stringify(dto.keywords ?? []),
        sampleQuestions: JSON.stringify(dto.sampleQuestions ?? []),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTopicDto) {
    await this.ensureExists(id);
    return this.prisma.topicNode.update({
      where: { id },
      data: {
        title: dto.title,
        parentKey: dto.parentKey,
        sortOrder: dto.sortOrder,
        keywordsJson:
          dto.keywords !== undefined ? JSON.stringify(dto.keywords) : undefined,
        sampleQuestions:
          dto.sampleQuestions !== undefined
            ? JSON.stringify(dto.sampleQuestions)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.topicNode.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const item = await this.prisma.topicNode.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('موضوع یافت نشد');
    return item;
  }
}
