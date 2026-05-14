'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Award,
  Video,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAuthStore, type Role } from '@/stores/auth-store';
import Cookies from 'js-cookie';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItemsByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Perdoruesit', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { label: 'Kurset', href: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Analitika', href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { label: 'Konfigurime', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ],
  INSTRUCTOR: [
    { label: 'Dashboard', href: '/instructor/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Kurset e Mia', href: '/instructor/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Sesione Live', href: '/instructor/live', icon: <Video className="h-5 w-5" /> },
    { label: 'Detyrat', href: '/instructor/assignments', icon: <FileText className="h-5 w-5" /> },
    { label: 'Analitika', href: '/instructor/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  ],
  STUDENT: [
    { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Kurset e Mia', href: '/student/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Kalendari', href: '/student/calendar', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Certifikatat', href: '/student/certificates', icon: <Award className="h-5 w-5" /> },
  ],
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const navItems = navItemsByRole[role];

  const handleLogout = () => {
    logout();
    Cookies.remove('zklms-token');
    Cookies.remove('zklms-user');
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              Z
            </div>
            <span className="text-lg font-semibold text-slate-900">ZK-LMS</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Dilni
          </button>
        </div>
      </div>
    </aside>
  );
}
