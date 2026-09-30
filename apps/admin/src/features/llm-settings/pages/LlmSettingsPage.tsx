import {
  Button,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { Controller } from 'react-hook-form';
import { useState } from 'react';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';
import { useAiPreview, useLlmSettingsForm } from '../hooks/useLlmSettings';

export function LlmSettingsPage() {
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;
  const { form, query, onSubmit, isSaving } = useLlmSettingsForm(eventId);
  const preview = useAiPreview(eventId);
  const [previewText, setPreviewText] = useState('چطور ثبت‌نام کنم؟');
  const { register, control } = form;

  return (
    <Stack>
      <Title order={3}>تنظیمات AI</Title>
      <Text size="sm" c="dimmed">
        API Key فعلی: {query.data?.apiKeyMasked || '—'} | پیکربندی‌شده:{' '}
        {query.data?.hasApiKey ? 'بله' : 'خیر (fallback FAQ بدون LLM)'}
      </Text>
      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput label="Base URL" dir="ltr" {...register('baseUrl')} />
          <TextInput label="API Key (برای تغییر)" dir="ltr" {...register('apiKey')} />
          <TextInput label="Model" dir="ltr" {...register('model')} />
          <Controller
            name="maxTokens"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Max Tokens"
                value={field.value}
                onChange={(v) => field.onChange(Number(v) || 500)}
              />
            )}
          />
          <Controller
            name="temperature"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Temperature"
                decimalScale={2}
                step={0.1}
                min={0}
                max={1}
                value={field.value}
                onChange={(v) => field.onChange(Number(v) || 0)}
              />
            )}
          />
          <Textarea label="System Prompt" minRows={4} {...register('systemPrompt')} />
          <Button type="submit" loading={isSaving}>
            ذخیره
          </Button>
        </Stack>
      </form>

      <Title order={4} mt="lg">
        پیش‌نمایش پاسخ
      </Title>
      <Textarea
        value={previewText}
        onChange={(e) => setPreviewText(e.currentTarget.value)}
        minRows={2}
      />
      <Button
        variant="light"
        loading={preview.isPending}
        onClick={() => preview.mutate(previewText)}
      >
        تست پاسخ
      </Button>
      {preview.data && (
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            موضوع: {preview.data.topicKey ?? '—'} | ارجاع:{' '}
            {preview.data.escalated ? 'بله' : 'خیر'}
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{preview.data.text}</Text>
        </Stack>
      )}
    </Stack>
  );
}
