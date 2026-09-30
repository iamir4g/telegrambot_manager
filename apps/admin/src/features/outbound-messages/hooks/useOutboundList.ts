import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { fetchOutbound } from '../api/outboundApi';
import type { OutboundTarget } from '../model/types';

export function useOutboundList(eventId: string | undefined, target: OutboundTarget) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['outbound', eventId, target],
    enabled: Boolean(token && eventId),
    queryFn: () => fetchOutbound(token!, eventId!, target),
  });
}
