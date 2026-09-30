import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../auth';
import { createFaq } from '../api/faqsApi';
import type { FaqFormValues } from '../model/types';

const schema = z.object({
  question: z.string().min(2, 'سؤال را وارد کنید'),
  answer: z.string().min(2, 'پاسخ را وارد کنید'),
  topicKey: z.string(),
});

export function useFaqForm(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const form = useForm<FaqFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { question: '', answer: '', topicKey: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FaqFormValues) => createFaq(token!, eventId!, values),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['faqs', eventId] });
      form.reset();
      notifications.show({ color: 'teal', message: 'سؤال ثبت شد (پیش‌نویس)' });
    },
    onError: (err: Error) => {
      notifications.show({ color: 'red', message: err.message });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return { form, onSubmit, isSubmitting: mutation.isPending };
}
