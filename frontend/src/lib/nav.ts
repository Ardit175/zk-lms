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
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/stores/auth-store';
import { al } from '@/lib/i18n/al';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** keywords to help the command palette match */
  keywords?: string[];
}

/** Single source of truth for per-role navigation, shared by the sidebar and ⌘K palette. */
export const navItemsByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: al.nav.dashboard, href: '/admin/dashboard', icon: LayoutDashboard, keywords: ['paneli', 'home', 'statistika'] },
    { label: 'Perdoruesit', href: '/admin/users', icon: Users, keywords: ['users', 'studente', 'instruktor', 'role'] },
    { label: al.nav.courses, href: '/admin/courses', icon: BookOpen, keywords: ['kurse', 'aprovim', 'review'] },
    { label: al.nav.analytics, href: '/admin/analytics', icon: BarChart3, keywords: ['grafike', 'raporte', 'trend'] },
    { label: al.nav.settings, href: '/admin/settings', icon: Settings, keywords: ['kategori', 'konfigurim'] },
  ],
  INSTRUCTOR: [
    { label: al.nav.dashboard, href: '/instructor/dashboard', icon: LayoutDashboard, keywords: ['paneli', 'home'] },
    { label: 'Kurset e Mia', href: '/instructor/courses', icon: BookOpen, keywords: ['kurse', 'course builder', 'krijo'] },
    { label: 'Sesione Live', href: '/instructor/live', icon: Video, keywords: ['live', 'qa', 'pyetje'] },
    { label: 'Detyrat', href: '/instructor/assignments', icon: FileText, keywords: ['detyra', 'assignment', 'vleresim'] },
    { label: al.nav.analytics, href: '/instructor/analytics', icon: BarChart3, keywords: ['grafike', 'progres'] },
  ],
  STUDENT: [
    { label: al.nav.dashboard, href: '/student/dashboard', icon: LayoutDashboard, keywords: ['paneli', 'home', 'vazhdo'] },
    { label: 'Kurset e Mia', href: '/student/courses', icon: BookOpen, keywords: ['kurse', 'mesime', 'progres'] },
    { label: 'Kalendari', href: '/student/calendar', icon: Calendar, keywords: ['afate', 'detyra', 'deadline'] },
    { label: 'Certifikatat', href: '/student/certificates', icon: Award, keywords: ['certifikata', 'arritje', 'pdf'] },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  INSTRUCTOR: 'Instruktor',
  STUDENT: 'Student',
};
