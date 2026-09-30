import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../../shared/api/client';
import { useAuth } from '../../auth';

type LlmSettings = {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
};

type FormValues = {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
};

export function useLlmSettings(eventId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['llm-settings', eventId],
    enabled: Boolean(token && eventId),
    queryFn: () =>
      apiFetch<LlmSettings>(`/ai/settings/${eventId}`, { token }),
  });
}

export function useLlmSettingsForm(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const query = useLlmSettings(eventId);
  const form = useForm<FormValues>({
    defaultValues: {
      baseUrl: '',
      apiKey: '',
      model: '',
      maxTokens: 500,
      temperature: 0.2,
      systemPrompt: '',
    },
  });

  useEffect(() => {
    if (!query.data) return;
    form.reset({
      baseUrl: query.data.baseUrl,
      apiKey: '',
      model: query.data.model,
      maxTokens: query.data.maxTokens,
      temperature: query.data.temperature,
      systemPrompt: query.data.systemPrompt,
    });
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const body: Record<string, unknown> = { ...values };
      if (!values.apiKey) delete body.apiKey;
      return apiFetch(`/ai/settings/${eventId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['llm-settings', eventId] });
      notifications.show({ color: 'teal', message: 'تنظیمات AI ذخیره شد' });
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

export function useAiPreview(eventId?: string) {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<{ text: string; escalated: boolean; topicKey: string | null }>(
        '/ai/preview',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ eventId, text }),
        },
      ),
  });
}
