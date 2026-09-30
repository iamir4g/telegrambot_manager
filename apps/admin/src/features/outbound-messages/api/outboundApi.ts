import { apiFetch } from '../../../shared/api/client';
import type {
  OutboundFormValues,
  OutboundMessage,
  OutboundTarget,
} from '../model/types';

export function fetchOutbound(
  token: string,
  eventId: string,
  target: OutboundTarget,
) {
  return apiFetch<OutboundMessage[]>(
    `/outbound?eventId=${eventId}&target=${target}`,
    { token },
  );
}

export function createOutbound(
  token: string,
  payload: {
    eventId: string;
    target: OutboundTarget;
    title: string;
    bodyHtml: string;
    send?: boolean;
  },
) {
  return apiFetch<OutboundMessage>('/outbound', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateOutbound(
  token: string,
  id: string,
  values: OutboundFormValues,
) {
  return apiFetch<OutboundMessage>(`/outbound/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(values),
  });
}

export function sendOutbound(token: string, id: string) {
  return apiFetch<OutboundMessage>(`/outbound/${id}/send`, {
    method: 'POST',
    token,
  });
}

export function deleteOutbound(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/outbound/${id}`, {
    method: 'DELETE',
    token,
  });
}
