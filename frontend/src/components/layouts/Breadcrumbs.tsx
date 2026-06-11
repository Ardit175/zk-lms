'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// Human-readable Albanian labels for known path segments. Unknown segments
// (cuids, slugs) are skipped so the trail stays clean.
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  instructor: 'Instruktor',
  student: 'Student',
  dashboard: 'Paneli',
  courses: 'Kurset',
  users: 'Perdoruesit',
  analytics: 'Analitika',
  settings: 'Cilesimet',
  live: 'Sesione Live',
  assignments: 'Detyrat',
  calendar: 'Kalendari',
  certificates: 'Certifikatat',
  notifications: 'Njoftimet',
  review: 'Rishikim',
  edit: 'Redakto',
  learn: 'Mesimi',
  submissions: 'Dorezimet',
};

const looksLikeId = (s: string) => s.length > 18 || /^c[a-z0-9]{20,}$/i.test(s) || /\d/.test(s) && s.includes('-');

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments
    .map((seg, i) => ({
      label: SEGMENT_LABELS[seg] ?? (looksLikeId(seg) ? null : decodeURIComponent(seg)),
      href: '/' + segments.slice(0, i + 1).join('/'),
    }))
    .filter((c): c is { label: string; href: string } => c.label !== null);

  if (crumbs.length === 0) return null;

  return (
    <motion.nav
      key={pathname}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={crumb.href}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </motion.nav>
  );
}
