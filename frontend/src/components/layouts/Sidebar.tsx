'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, GraduationCap, ChevronLeft, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { useAuthStore, type Role } from '@/stores/auth-store';
import { al } from '@/lib/i18n/al';
import { navItemsByRole, ROLE_LABELS } from '@/lib/nav';

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

/** Inner nav shared by the desktop rail and the mobile drawer. */
function SidebarBody({
  role,
  collapsed,
  scope,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  scope: string;
  onNavigate?: () => void;
}) {
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
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn('flex h-16 items-center border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 text-white shadow-sm shadow-primary/30">
            <GraduationCap className="h-5 w-5" />
          </span>
          {!collapsed && <span className="font-display text-lg font-bold text-sidebar-foreground">ZK-LMS</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`active-${scope}`}
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className="relative z-10 h-5 w-5 shrink-0" />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3 rounded-lg px-2 py-2', collapsed && 'justify-center px-0')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? al.nav.logout : undefined}
          className={cn(
            'press mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && al.nav.logout}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ role, collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out lg:block',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <SidebarBody role={role} collapsed={collapsed} scope="desktop" />
        {/* Collapse toggle on the rail edge */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Zgjero menune' : 'Mbyll menune'}
          className="press absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile drawer */}
      <div className={cn('lg:hidden', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        {/* backdrop */}
        <div
          onClick={onCloseMobile}
          className={cn(
            'fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
        <aside
          className={cn(
            'fixed left-0 top-0 z-50 h-screen w-72 border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            onClick={onCloseMobile}
            aria-label="Mbyll menune"
            className="press absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarBody role={role} collapsed={false} scope="mobile" onNavigate={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}
