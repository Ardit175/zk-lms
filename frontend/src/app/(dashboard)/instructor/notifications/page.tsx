'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { NotificationsPage } from '@/components/notifications';

export default function InstructorNotificationsPage() {
  return (
    <DashboardLayout role="INSTRUCTOR">
      <NotificationsPage />
    </DashboardLayout>
  );
}
