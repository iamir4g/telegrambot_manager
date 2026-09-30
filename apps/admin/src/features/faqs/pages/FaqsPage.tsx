import {
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';
import { useFaqList } from '../hooks/useFaqList';
import { useFaqForm } from '../hooks/useFaqForm';
import { useFaqActions } from '../hooks/useFaqActions';

export function FaqsPage() {
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;
  const list = useFaqList(eventId);
  const { form, onSubmit, isSubmitting } = useFaqForm(eventId);
  const { approve, remove } = useFaqActions(eventId);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Stack>
      <Title order={3}>سؤالات متداول</Title>
      <Text c="dimmed" size="sm">
        فقط آیتم‌های تأییدشده در پاسخ بات استفاده می‌شوند.
      </Text>

      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            label="سؤال"
            error={errors.question?.message}
            {...register('question')}
          />
          <Textarea
            label="پاسخ"
            minRows={3}
            error={errors.answer?.message}
            {...register('answer')}
          />
          <TextInput
            label="کلید موضوع (اختیاری)"
            dir="ltr"
            placeholder="schedule"
            {...register('topicKey')}
          />
          <Button type="submit" loading={isSubmitting} disabled={!eventId}>
            افزودن پیش‌نویس
          </Button>
        </Stack>
      </form>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>سؤال</Table.Th>
            <Table.Th>موضوع</Table.Th>
            <Table.Th>وضعیت</Table.Th>
            <Table.Th>عملیات</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(list.data ?? []).map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text fw={600}>{item.question}</Text>
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {item.answer}
                </Text>
              </Table.Td>
              <Table.Td dir="ltr">{item.topicKey || '—'}</Table.Td>
              <Table.Td>
                <Badge color={item.status === 'APPROVED' ? 'teal' : 'yellow'}>
                  {item.status === 'APPROVED' ? 'تأییدشده' : 'پیش‌نویس'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {item.status !== 'APPROVED' && (
                    <Button
                      size="xs"
                      variant="light"
                      loading={approve.isPending}
                      onClick={() => approve.mutate(item.id)}
                    >
                      تأیید
                    </Button>
                  )}
                  <Button
                    size="xs"
                    color="red"
                    variant="subtle"
                    loading={remove.isPending}
                    onClick={() => remove.mutate(item.id)}
                  >
                    حذف
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
