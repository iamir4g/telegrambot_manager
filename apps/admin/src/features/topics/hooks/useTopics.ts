import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../auth';
import { createTopic, deleteTopic, fetchTopics } from '../api/topicsApi';

export function useTopicList(eventId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['topics', eventId],
    enabled: Boolean(token && eventId),
    queryFn: () => fetchTopics(token!, eventId!),
  });
}

const schema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  keywords: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function useTopicForm(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { key: '', title: '', keywords: '' },
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTopic(token!, eventId!, {
        key: values.key,
        title: values.title,
        keywords: values.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['topics', eventId] });
      form.reset();
      notifications.show({ color: 'teal', message: 'موضوع اضافه شد' });
    },
  });
  return {
    form,
    onSubmit: form.handleSubmit((v) => mutation.mutate(v)),
    isSubmitting: mutation.isPending,
  };
}

export function useTopicDelete(eventId?: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTopic(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['topics', eventId] });
    },
  });
}
