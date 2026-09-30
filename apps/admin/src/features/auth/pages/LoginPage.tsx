import { Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useLoginForm } from '../hooks/useLoginForm';

export function LoginPage() {
  const { form, onSubmit, isSubmitting } = useLoginForm();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Stack align="center" justify="center" mih="100vh" p="md">
      <Paper w={400} maw="100%" p="xl" withBorder shadow="sm">
        <form onSubmit={onSubmit}>
          <Stack>
            <Title order={3}>ورود به پنل فیناپ</Title>
            <Text size="sm" c="dimmed">
              دستیار رویداد Credit First
            </Text>
            <TextInput
              label="ایمیل"
              dir="ltr"
              error={errors.email?.message}
              {...register('email')}
            />
            <PasswordInput
              label="رمز عبور"
              dir="ltr"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting}>
              ورود
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
