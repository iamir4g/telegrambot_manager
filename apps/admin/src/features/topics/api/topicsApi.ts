import { apiFetch } from '../../../shared/api/client';
import type { TopicNode } from '../model/types';

export function fetchTopics(token: string, eventId: string) {
  return apiFetch<TopicNode[]>(`/topics?eventId=${eventId}`, { token });
}

export function createTopic(
  token: string,
  eventId: string,
  data: { key: string; title: string; keywords: string[] },
) {
  return apiFetch<TopicNode>('/topics', {
    method: 'POST',
    token,
    body: JSON.stringify({ eventId, ...data }),
  });
}

export function deleteTopic(token: string, id: string) {
  return apiFetch<void>(`/topics/${id}`, { method: 'DELETE', token });
}
