'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { NotificationsPage } from '@/components/notifications';

export default function AdminNotificationsPage() {
  return (
    <DashboardLayout role="ADMIN">
      <NotificationsPage />
    </DashboardLayout>
  );
}
