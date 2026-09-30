import { Stack, Tabs, Title } from '@mantine/core';
import { useActiveEvent } from '../../../shared/hooks/useActiveEvent';
import { OutboundTargetPanel } from '../ui/OutboundTargetPanel';

export function OutboundMessagesPage() {
  const eventQuery = useActiveEvent();
  const eventId = eventQuery.data?.id;

  return (
    <Stack>
      <Title order={3}>ارسال پیام</Title>
      <Tabs defaultValue="channel">
        <Tabs.List>
          <Tabs.Tab value="channel">کانال تلگرام</Tabs.Tab>
          <Tabs.Tab value="private">پیام خصوصی (ربات)</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="channel" pt="md">
          <OutboundTargetPanel
            eventId={eventId}
            target="CHANNEL"
            hint="پیام به کانال تنظیم‌شده در «تنظیمات تلگرام» ارسال می‌شود. ویرایش/حذف فقط برای پیام‌های ارسال‌شده از همین پنل اعمال می‌شود."
          />
        </Tabs.Panel>

        <Tabs.Panel value="private" pt="md">
          <OutboundTargetPanel
            eventId={eventId}
            target="PRIVATE"
            hint="فقط به کاربرانی که از طریق بات برای دریافت پیام خصوصی opt-in کرده‌اند ارسال می‌شود."
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
