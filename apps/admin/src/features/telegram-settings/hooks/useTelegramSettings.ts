import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../auth';
import {
  fetchTelegramSettings,
  testBot,
  testChannel,
  updateTelegramSettings,
} from '../api/telegramApi';
import type { TelegramFormValues } from '../model/types';

export function useTelegramSettings(eventId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['telegram-settings', eventId],
    enabled: Boolean(token && eventId),
    queryFn: () => fetchTelegramSettings(token!, eventId!),
  });
}

export function useTelegramSettingsForm(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const query = useTelegramSettings(eventId);
  const form = useForm<TelegramFormValues>({
    defaultValues: {
      botToken: '',
      channelChatId: '',
      webhookUrl: '',
      mode: 'LONG_POLLING',
      isEnabled: false,
      startMessage: '',
      outOfScopeMessage: '',
      escalateMessage: '',
      errorMessage: '',
      optInPrompt: '',
    },
  });

  useEffect(() => {
    if (!query.data) return;
    form.reset({
      botToken: '',
      channelChatId: query.data.channelChatId,
      webhookUrl: query.data.webhookUrl,
      mode: query.data.mode,
      isEnabled: query.data.isEnabled,
      startMessage: query.data.startMessage,
      outOfScopeMessage: query.data.outOfScopeMessage,
      escalateMessage: query.data.escalateMessage,
      errorMessage: query.data.errorMessage,
      optInPrompt: query.data.optInPrompt,
    });
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: (values: TelegramFormValues) =>
      updateTelegramSettings(token!, eventId!, values),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['telegram-settings', eventId] });
      notifications.show({ color: 'teal', message: 'ذخیره شد' });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });

  return {
    form,
    query,
    onSubmit: form.handleSubmit((v) => save.mutate(v)),
    isSaving: save.isPending,
  };
}

export function useTelegramTests(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const bot = useMutation({
    mutationFn: () => testBot(token!, eventId!),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['telegram-settings', eventId] });
      notifications.show({
        color: 'teal',
        message: `اتصال بات OK: @${res.bot.username ?? res.bot.id}`,
      });
    },
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });
  const channel = useMutation({
    mutationFn: () => testChannel(token!, eventId!),
    onSuccess: () =>
      notifications.show({ color: 'teal', message: 'پیام تست کانال ارسال شد' }),
    onError: (err: Error) =>
      notifications.show({ color: 'red', message: err.message }),
  });
  return { bot, channel };
}
