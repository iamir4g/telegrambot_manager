import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { useAuth } from '../../features/auth';

export type ActiveEvent = {
  id: string;
  title: string;
  slug: string;
  dayGuideJson: string;
};

export function useActiveEvent() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['events', 'active'],
    enabled: Boolean(token),
    queryFn: () => apiFetch<ActiveEvent>('/events/active', { token }),
  });
}
