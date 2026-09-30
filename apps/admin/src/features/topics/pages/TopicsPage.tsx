import {
  Button,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';
import { useTopicDelete, useTopicForm, useTopicList } from '../hooks/useTopics';

export function TopicsPage() {
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;
  const list = useTopicList(eventId);
  const { form, onSubmit, isSubmitting } = useTopicForm(eventId);
  const remove = useTopicDelete(eventId);
  const { register, formState } = form;

  return (
    <Stack>
      <Title order={3}>درخت موضوعات AI</Title>
      <Text c="dimmed" size="sm">
        بات فقط داخل این موضوعات پاسخ می‌دهد؛ خارج از آن ارجاع می‌شود.
      </Text>
      <form onSubmit={onSubmit}>
        <Group align="flex-end" grow>
          <TextInput label="کلید" dir="ltr" error={formState.errors.key?.message} {...register('key')} />
          <TextInput label="عنوان" error={formState.errors.title?.message} {...register('title')} />
          <TextInput label="کلمات کلیدی (با ویرگول)" {...register('keywords')} />
          <Button type="submit" loading={isSubmitting}>
            افزودن
          </Button>
        </Group>
      </form>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>کلید</Table.Th>
            <Table.Th>عنوان</Table.Th>
            <Table.Th>کلمات کلیدی</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(list.data ?? []).map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td dir="ltr">{t.key}</Table.Td>
              <Table.Td>{t.title}</Table.Td>
              <Table.Td>{t.keywordsJson}</Table.Td>
              <Table.Td>
                <Button size="xs" color="red" variant="subtle" onClick={() => remove.mutate(t.id)}>
                  حذف
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
