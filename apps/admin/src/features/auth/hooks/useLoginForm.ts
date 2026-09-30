import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const schema = z.object({
  email: z.email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'حداقل ۶ کاراکتر'),
});

export type LoginFormValues = z.infer<typeof schema>;

export function useLoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'admin@finnap.local',
      password: 'admin123',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      navigate('/faqs');
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'ورود ناموفق',
        message: err instanceof Error ? err.message : 'خطا',
      });
    }
  });

  return { form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
