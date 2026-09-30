import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../auth';
import { approveFaq, deleteFaq } from '../api/faqsApi';

export function useFaqActions(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['faqs', eventId] });

  const approve = useMutation({
    mutationFn: (id: string) => approveFaq(token!, id),
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'teal', message: 'تأیید شد' });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFaq(token!, id),
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'gray', message: 'حذف شد' });
    },
  });

  return { approve, remove };
}
