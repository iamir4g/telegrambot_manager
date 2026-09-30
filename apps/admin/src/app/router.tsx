import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from './layout';
import { useAuth } from '../features/auth';
import { LoginPage } from '../features/auth';
import { FaqsPage } from '../features/faqs';
import { TopicsPage } from '../features/topics';
import { TelegramSettingsPage } from '../features/telegram-settings';
import { EscalationsPage } from '../features/escalations';
import { ReportsPage } from '../features/reports';
import { LlmSettingsPage } from '../features/llm-settings';
import { OutboundMessagesPage } from '../features/outbound-messages';
import { Center, Loader } from '@mantine/core';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShellLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/faqs" replace />} />
        <Route path="faqs" element={<FaqsPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="telegram" element={<TelegramSettingsPage />} />
        <Route path="messages" element={<OutboundMessagesPage />} />
        <Route path="llm" element={<LlmSettingsPage />} />
        <Route path="escalations" element={<EscalationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
