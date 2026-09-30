import { Badge, Button, Group, Stack, Table, Text, Title } from '@mantine/core';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';
import { useEscalations, useUpdateEscalationStatus } from '../hooks/useEscalations';

export function EscalationsPage() {
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;
  const list = useEscalations(eventId);
  const update = useUpdateEscalationStatus(eventId);

  return (
    <Stack>
      <Title order={3}>صف ارجاع انسانی</Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>موضوع</Table.Th>
            <Table.Th>نوع</Table.Th>
            <Table.Th>وضعیت</Table.Th>
            <Table.Th>کاربر</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(list.data ?? []).map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text fw={600}>{item.subject}</Text>
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {item.body}
                </Text>
              </Table.Td>
              <Table.Td>{item.type}</Table.Td>
              <Table.Td>
                <Badge>{item.status}</Badge>
              </Table.Td>
              <Table.Td dir="ltr">{item.username || '—'}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {item.status === 'OPEN' && (
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() =>
                        update.mutate({ id: item.id, status: 'IN_PROGRESS' })
                      }
                    >
                      در حال پیگیری
                    </Button>
                  )}
                  {item.status !== 'RESOLVED' && (
                    <Button
                      size="xs"
                      onClick={() =>
                        update.mutate({ id: item.id, status: 'RESOLVED' })
                      }
                    >
                      حل شد
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
