import { Injectable, NotFoundException } from '@nestjs/common';
import { EscalationStatus, EscalationType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class EscalationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(eventId: string) {
    return this.prisma.escalationTicket.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: {
    eventId: string;
    type: EscalationType;
    telegramUserId?: string;
    username?: string;
    subject: string;
    body: string;
  }) {
    return this.prisma.escalationTicket.create({
      data: {
        eventId: input.eventId,
        type: input.type,
        telegramUserId: input.telegramUserId ?? '',
        username: input.username ?? '',
        subject: input.subject,
        body: input.body,
      },
    });
  }

  async updateStatus(id: string, status: EscalationStatus) {
    const ticket = await this.prisma.escalationTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('تیکت یافت نشد');
    return this.prisma.escalationTicket.update({
      where: { id },
      data: { status },
    });
  }
}
