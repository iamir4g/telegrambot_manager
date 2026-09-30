import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../auth';
import {
  createOutbound,
  deleteOutbound,
  sendOutbound,
  updateOutbound,
} from '../api/outboundApi';
import type { OutboundFormValues, OutboundTarget } from '../model/types';

export function useOutboundActions(
  eventId: string | undefined,
  target: OutboundTarget,
) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['outbound', eventId, target] });

  const create = useMutation({
    mutationFn: (input: OutboundFormValues & { send?: boolean }) =>
      createOutbound(token!, {
        eventId: eventId!,
        target,
        title: input.title,
        bodyHtml: input.bodyHtml,
        send: input.send,
      }),
    onSuccess: async (_, vars) => {
      await invalidate();
      notifications.show({
        color: 'teal',
        message: vars.send ? 'پیام ارسال شد' : 'پیش‌نویس ذخیره شد',
      });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: OutboundFormValues }) =>
      updateOutbound(token!, id, values),
    onSuccess: async () => {
      await invalidate();
      notifications.show({
        color: 'teal',
        message: 'پیام به‌روز شد (در تلگرام هم ویرایش شد در صورت ارسال قبلی)',
      });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });

  const send = useMutation({
    mutationFn: (id: string) => sendOutbound(token!, id),
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'teal', message: 'ارسال انجام شد' });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteOutbound(token!, id),
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'gray', message: 'پیام حذف شد' });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });

  return { create, update, send, remove };
}
