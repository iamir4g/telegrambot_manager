import { AppShell, Burger, Group, NavLink, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  IconBrain,
  IconBrandTelegram,
  IconChartBar,
  IconHelp,
  IconLogout,
  IconSend,
  IconTopologyStar3,
  IconTicket,
} from '@tabler/icons-react';
import { useAuth } from '../features/auth';

const links = [
  { to: '/faqs', label: 'سؤالات متداول', icon: IconHelp },
  { to: '/topics', label: 'درخت موضوعات', icon: IconTopologyStar3 },
  { to: '/telegram', label: 'تنظیمات تلگرام', icon: IconBrandTelegram },
  { to: '/messages', label: 'ارسال پیام', icon: IconSend },
  { to: '/llm', label: 'تنظیمات AI', icon: IconBrain },
  { to: '/escalations', label: 'ارجاع‌ها', icon: IconTicket },
  { to: '/reports', label: 'گزارش‌ها', icon: IconChartBar },
];

export function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>فیناپ — پنل دستیار</Title>
          </Group>
          <Text size="sm" c="dimmed">
            {user?.name} ({user?.role})
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {links.map((link) => (
          <NavLink
            key={link.to}
            label={link.label}
            leftSection={<link.icon size={18} />}
            active={location.pathname.startsWith(link.to)}
            onClick={() => navigate(link.to)}
            mb={4}
          />
        ))}
        <NavLink
          label="خروج"
          leftSection={<IconLogout size={18} />}
          onClick={logout}
          mt="xl"
          color="red"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
