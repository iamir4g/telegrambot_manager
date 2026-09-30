import { useQuery } from '@tanstack/react-query';
import { SimpleGrid, Stack, Text, Title, Card } from '@mantine/core';
import { apiFetch } from '../../../shared/api/client';
import { useAuth } from '../../auth';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';

type Summary = {
  conversations: number;
  userMessages: number;
  escalations: number;
  openEscalations: number;
  registrationClicks: number;
  optedInUsers: number;
  botUsers: number;
  recentUnanswered: Array<{ id: string; subject: string; body: string }>;
};

export function ReportsPage() {
  const { token } = useAuth();
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;
  const summary = useQuery({
    queryKey: ['reports', eventId],
    enabled: Boolean(token && eventId),
    queryFn: () =>
      apiFetch<Summary>(`/reports/summary?eventId=${eventId}`, { token }),
  });

  const cards = [
    { label: 'کاربران بات', value: summary.data?.botUsers ?? 0 },
    { label: 'کاربران opt-in', value: summary.data?.optedInUsers ?? 0 },
    { label: 'گفتگوها', value: summary.data?.conversations ?? 0 },
    { label: 'پیام کاربران', value: summary.data?.userMessages ?? 0 },
    { label: 'ارجاع‌ها', value: summary.data?.escalations ?? 0 },
    { label: 'ارجاع باز', value: summary.data?.openEscalations ?? 0 },
  ];

  return (
    <Stack>
      <Title order={3}>گزارش‌ها</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {cards.map((c) => (
          <Card key={c.label} withBorder padding="lg">
            <Text size="sm" c="dimmed">
              {c.label}
            </Text>
            <Text fw={700} size="xl">
              {c.value}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
      <Title order={4}>آخرین بی‌پاسخ‌ها</Title>
      {(summary.data?.recentUnanswered ?? []).map((item) => (
        <Stack key={item.id} gap={2}>
          <Text fw={600}>{item.subject}</Text>
          <Text size="sm" c="dimmed">
            {item.body}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
