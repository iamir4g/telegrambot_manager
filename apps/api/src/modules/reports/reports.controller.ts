import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../shared/auth/guards';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async summary(@Query('eventId') eventId: string) {
    const [
      conversations,
      messages,
      escalations,
      openEscalations,
      clicks,
      optedInUsers,
      botUsers,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: { eventId } }),
      this.prisma.message.count({
        where: { conversation: { eventId }, role: 'user' },
      }),
      this.prisma.escalationTicket.count({ where: { eventId } }),
      this.prisma.escalationTicket.count({
        where: { eventId, status: 'OPEN' },
      }),
      this.prisma.linkClick.count({ where: { eventId } }),
      this.prisma.audienceConsent.count({ where: { optedIn: true } }),
      this.prisma.conversation
        .groupBy({
          by: ['telegramUserId'],
          where: { eventId },
        })
        .then((rows) => rows.length),
    ]);

    const recentUnanswered = await this.prisma.escalationTicket.findMany({
      where: { eventId, type: 'UNANSWERED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      conversations,
      userMessages: messages,
      escalations,
      openEscalations,
      registrationClicks: clicks,
      optedInUsers,
      botUsers,
      recentUnanswered,
    };
  }
}
