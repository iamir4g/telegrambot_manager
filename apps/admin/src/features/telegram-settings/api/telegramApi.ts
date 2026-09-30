import { apiFetch } from '../../../shared/api/client';
import type { TelegramFormValues, TelegramSettings } from '../model/types';

export function fetchTelegramSettings(token: string, eventId: string) {
  return apiFetch<TelegramSettings>(`/telegram/settings/${eventId}`, { token });
}

export function updateTelegramSettings(
  token: string,
  eventId: string,
  values: Partial<TelegramFormValues>,
) {
  const body = { ...values };
  if (!body.botToken) delete body.botToken;
  return apiFetch<TelegramSettings>(`/telegram/settings/${eventId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  });
}

export function testBot(token: string, eventId: string) {
  return apiFetch<{ ok: boolean; bot: { username?: string; id: number } }>(
    `/telegram/settings/${eventId}/test-bot`,
    { method: 'POST', token },
  );
}

export function testChannel(token: string, eventId: string) {
  return apiFetch<{ ok: boolean }>(`/telegram/settings/${eventId}/test-channel`, {
    method: 'POST',
    token,
  });
}
