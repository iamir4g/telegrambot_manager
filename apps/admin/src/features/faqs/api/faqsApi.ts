import { apiFetch } from '../../../shared/api/client';
import type { FaqFormValues, FaqItem } from '../model/types';

export function fetchFaqs(token: string, eventId: string) {
  return apiFetch<FaqItem[]>(`/faqs?eventId=${eventId}`, { token });
}

export function createFaq(
  token: string,
  eventId: string,
  values: FaqFormValues,
) {
  return apiFetch<FaqItem>('/faqs', {
    method: 'POST',
    token,
    body: JSON.stringify({ eventId, ...values, status: 'DRAFT' }),
  });
}

export function approveFaq(token: string, id: string) {
  return apiFetch<FaqItem>(`/faqs/${id}/approve`, { method: 'POST', token });
}

export function deleteFaq(token: string, id: string) {
  return apiFetch<void>(`/faqs/${id}`, { method: 'DELETE', token });
}
