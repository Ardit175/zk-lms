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
  GraduationCap,
} from 'lucide-react';
import { useAuthStore, type Role } from '@/stores/auth-store';
import { al } from '@/lib/i18n/al';
import Cookies from 'js-cookie';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItemsByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: al.nav.dashboard, href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Perdoruesit', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { label: al.nav.courses, href: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: al.nav.analytics, href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { label: al.nav.settings, href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ],
  INSTRUCTOR: [
    { label: al.nav.dashboard, href: '/instructor/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Kurset e Mia', href: '/instructor/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Sesione Live', href: '/instructor/live', icon: <Video className="h-5 w-5" /> },
    { label: 'Detyrat', href: '/instructor/assignments', icon: <FileText className="h-5 w-5" /> },
    { label: al.nav.analytics, href: '/instructor/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  ],
  STUDENT: [
    { label: al.nav.dashboard, href: '/student/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Kurset e Mia', href: '/student/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Kalendari', href: '/student/calendar', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Certifikatat', href: '/student/certificates', icon: <Award className="h-5 w-5" /> },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  INSTRUCTOR: 'Instruktor',
  STUDENT: 'Student',
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
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-100 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold shadow-sm shadow-indigo-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">ZK-LMS</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'border-indigo-600 bg-indigo-100 text-indigo-700'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            {al.nav.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}
