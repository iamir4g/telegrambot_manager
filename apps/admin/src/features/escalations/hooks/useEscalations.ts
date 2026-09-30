import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../shared/api/client';
import { useAuth } from '../../auth';

export type Escalation = {
  id: string;
  type: string;
  status: string;
  subject: string;
  body: string;
  username: string;
  createdAt: string;
};

export function useEscalations(eventId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['escalations', eventId],
    enabled: Boolean(token && eventId),
    queryFn: () =>
      apiFetch<Escalation[]>(`/escalations?eventId=${eventId}`, { token }),
  });
}

export function useUpdateEscalationStatus(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/escalations/${id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['escalations', eventId] });
    },
  });
}
