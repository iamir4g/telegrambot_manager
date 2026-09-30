import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { faqs: true, sessions: true, topics: true },
        },
      },
    });
  }

  async getActive() {
    const event = await this.prisma.event.findFirst({
      where: { isActive: true },
      include: {
        sessions: { orderBy: { sortOrder: 'asc' } },
        speakers: { orderBy: { sortOrder: 'asc' } },
        locations: { orderBy: { sortOrder: 'asc' } },
        sponsors: { orderBy: { sortOrder: 'asc' } },
        links: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!event) throw new NotFoundException('رویداد فعالی یافت نشد');
    return event;
  }

  async getById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { sortOrder: 'asc' } },
        speakers: { orderBy: { sortOrder: 'asc' } },
        locations: { orderBy: { sortOrder: 'asc' } },
        sponsors: { orderBy: { sortOrder: 'asc' } },
        links: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!event) throw new NotFoundException('رویداد یافت نشد');
    return event;
  }

  async updateDayGuide(eventId: string, dayGuide: Record<string, unknown>) {
    await this.getById(eventId);
    return this.prisma.event.update({
      where: { id: eventId },
      data: { dayGuideJson: JSON.stringify(dayGuide) },
    });
  }

  async upsertLink(
    eventId: string,
    data: { key: string; label: string; url: string; sortOrder?: number },
  ) {
    await this.getById(eventId);
    return this.prisma.eventLink.upsert({
      where: { eventId_key: { eventId, key: data.key } },
      create: { eventId, ...data },
      update: {
        label: data.label,
        url: data.url,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }
}
