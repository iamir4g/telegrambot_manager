import {
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { Controller } from 'react-hook-form';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';
import {
  useTelegramSettingsForm,
  useTelegramTests,
} from '../hooks/useTelegramSettings';

export function TelegramSettingsPage() {
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;
  const { form, query, onSubmit, isSaving } = useTelegramSettingsForm(eventId);
  const tests = useTelegramTests(eventId);
  const { register, control } = form;

  return (
    <Stack>
      <Title order={3}>تنظیمات تلگرام</Title>
      <Text size="sm" c="dimmed">
        توکن فعلی: {query.data?.botTokenMasked || '—'}{' '}
        {query.data?.botUsername ? `| @${query.data.botUsername}` : ''}
      </Text>
      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            label="Bot Token (برای تغییر پر کنید)"
            dir="ltr"
            {...register('botToken')}
          />
          <TextInput label="Channel Chat ID" dir="ltr" {...register('channelChatId')} />
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <Select
                label="حالت دریافت"
                data={[
                  { value: 'LONG_POLLING', label: 'Long Polling' },
                  { value: 'WEBHOOK', label: 'Webhook' },
                ]}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 'LONG_POLLING')}
              />
            )}
          />
          <TextInput label="Webhook URL" dir="ltr" {...register('webhookUrl')} />
          <Controller
            name="isEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                label="فعال بودن پاسخ‌گویی بات"
                checked={field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
              />
            )}
          />
          <Textarea label="پیام /start" minRows={2} {...register('startMessage')} />
          <Textarea label="خارج از موضوع" minRows={2} {...register('outOfScopeMessage')} />
          <Textarea label="ارجاع به تیم" minRows={2} {...register('escalateMessage')} />
          <Textarea label="خطای موقت" minRows={2} {...register('errorMessage')} />
          <Textarea label="متن Opt-in" minRows={2} {...register('optInPrompt')} />
          <Group>
            <Button type="submit" loading={isSaving}>
              ذخیره
            </Button>
            <Button
              variant="light"
              loading={tests.bot.isPending}
              onClick={() => tests.bot.mutate()}
            >
              تست اتصال بات
            </Button>
            <Button
              variant="light"
              loading={tests.channel.isPending}
              onClick={() => tests.channel.mutate()}
            >
              تست کانال
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
