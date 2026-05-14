'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { NotificationsPage } from '@/components/notifications';

export default function StudentNotificationsPage() {
  return (
    <DashboardLayout role="STUDENT">
      <NotificationsPage />
    </DashboardLayout>
  );
}
