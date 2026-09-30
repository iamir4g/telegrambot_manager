import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { fetchFaqs } from '../api/faqsApi';

export function useFaqList(eventId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['faqs', eventId],
    enabled: Boolean(token && eventId),
    queryFn: () => fetchFaqs(token!, eventId!),
  });
}
