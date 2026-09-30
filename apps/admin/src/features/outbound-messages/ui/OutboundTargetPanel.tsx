import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useOutboundList } from '../hooks/useOutboundList';
import { useOutboundActions } from '../hooks/useOutboundActions';
import { useOutboundFormState } from '../hooks/useOutboundFormState';
import { MessageRichEditor } from './MessageRichEditor';
import type { OutboundMessage, OutboundTarget } from '../model/types';

const statusLabel: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  SENT: 'ارسال‌شده',
  EDITED: 'ویرایش‌شده',
  FAILED: 'ناموفق',
  DELETED: 'حذف‌شده',
};

type Props = {
  eventId?: string;
  target: OutboundTarget;
  hint: string;
};

export function OutboundTargetPanel({ eventId, target, hint }: Props) {
  const list = useOutboundList(eventId, target);
  const actions = useOutboundActions(eventId, target);
  const form = useOutboundFormState();
  const [deleteOpened, deleteModal] = useDisclosure(false);
  const [pendingDelete, setPendingDelete] = useState<OutboundMessage | null>(
    null,
  );

  const busy =
    actions.create.isPending ||
    actions.update.isPending ||
    actions.send.isPending ||
    actions.remove.isPending;

  async function handleSave(send: boolean) {
    if (!form.values.bodyHtml.trim()) return;
    if (form.editingId) {
      await actions.update.mutateAsync({
        id: form.editingId,
        values: form.values,
      });
      if (send) {
        const item = list.data?.find((m) => m.id === form.editingId);
        if (item && (item.status === 'DRAFT' || item.status === 'FAILED')) {
          await actions.send.mutateAsync(form.editingId);
        }
      }
      form.reset();
      return;
    }
    await actions.create.mutateAsync({ ...form.values, send });
    form.reset();
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        {hint}
      </Text>

      <TextInput
        label="عنوان داخلی (فقط در پنل)"
        value={form.values.title}
        onChange={(e) => form.setTitle(e.currentTarget.value)}
      />
      <div>
        <Text size="sm" fw={500} mb={6}>
          متن پیام
        </Text>
        <MessageRichEditor
          value={form.values.bodyHtml}
          onChange={form.setBodyHtml}
        />
      </div>

      <Group>
        <Button
          variant="default"
          loading={busy}
          disabled={!eventId}
          onClick={() => void handleSave(false)}
        >
          {form.editingId ? 'ذخیره تغییرات' : 'ذخیره پیش‌نویس'}
        </Button>
        <Button
          loading={busy}
          disabled={!eventId}
          onClick={() => void handleSave(true)}
        >
          {form.editingId ? 'ذخیره و ارسال (در صورت پیش‌نویس)' : 'ارسال'}
        </Button>
        {form.editingId && (
          <Button variant="subtle" onClick={form.reset}>
            انصراف از ویرایش
          </Button>
        )}
      </Group>

      <Text fw={600} mt="md">
        تاریخچه
      </Text>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>عنوان</Table.Th>
            <Table.Th>وضعیت</Table.Th>
            <Table.Th>تحویل</Table.Th>
            <Table.Th>تاریخ</Table.Th>
            <Table.Th>عملیات</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(list.data ?? []).map((item) => {
            const sentCount = item.deliveries.filter(
              (d) => d.status === 'sent' || d.status === 'edited',
            ).length;
            const failedCount = item.deliveries.filter(
              (d) => d.status === 'failed',
            ).length;
            return (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text fw={600}>{item.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {item.bodyTelegramHtml.replace(/<[^>]+>/g, ' ')}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      item.status === 'FAILED'
                        ? 'red'
                        : item.status === 'DRAFT'
                          ? 'yellow'
                          : 'teal'
                    }
                  >
                    {statusLabel[item.status] ?? item.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {sentCount} موفق
                  {failedCount ? ` / ${failedCount} ناموفق` : ''}
                </Table.Td>
                <Table.Td>
                  {new Date(item.sentAt ?? item.createdAt).toLocaleString(
                    'fa-IR',
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => form.startEdit(item)}
                    >
                      ویرایش
                    </Button>
                    {(item.status === 'DRAFT' || item.status === 'FAILED') && (
                      <Button
                        size="xs"
                        loading={actions.send.isPending}
                        onClick={() => actions.send.mutate(item.id)}
                      >
                        ارسال
                      </Button>
                    )}
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => {
                        setPendingDelete(item);
                        deleteModal.open();
                      }}
                    >
                      حذف
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      <Modal
        opened={deleteOpened}
        onClose={deleteModal.close}
        title="حذف پیام"
        centered
      >
        <Stack>
          <Text>
            پیام از پنل حذف می‌شود و در صورت ارسال قبلی، از تلگرام هم پاک
            می‌گردد. ادامه می‌دهید؟
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={deleteModal.close}>
              انصراف
            </Button>
            <Button
              color="red"
              loading={actions.remove.isPending}
              onClick={async () => {
                if (!pendingDelete) return;
                await actions.remove.mutateAsync(pendingDelete.id);
                if (form.editingId === pendingDelete.id) form.reset();
                setPendingDelete(null);
                deleteModal.close();
              }}
            >
              حذف
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
