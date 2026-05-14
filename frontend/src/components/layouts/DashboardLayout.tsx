'use client';

import { Sidebar } from './Sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { type Role } from '@/stores/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <div className="pl-64">
        <header className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="flex h-full items-center justify-end px-6">
            <NotificationBell />
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
