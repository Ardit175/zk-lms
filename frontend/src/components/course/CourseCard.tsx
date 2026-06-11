'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Star, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Fillestar',
  INTERMEDIATE: 'Mesatar',
  ADVANCED: 'Avancuar',
};

export interface CourseCardProps {
  title: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructor?: { firstName: string; lastName: string; avatarUrl?: string | null };
  enrollmentCount?: number;
  rating?: number;
  /** 0-100 — when provided, shows a progress bar */
  progress?: number;
  /** course duration in minutes */
  duration?: number;
  /** badge shown top-right of the thumbnail (e.g. status) */
  badge?: React.ReactNode;
  /** overlay element top-right (e.g. dropdown menu trigger) */
  menu?: React.ReactNode;
  /** action area rendered at the bottom of the card body */
  footer?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function CourseCard({
  title,
  thumbnailUrl,
  category,
  level,
  instructor,
  enrollmentCount,
  rating,
  progress,
  duration,
  badge,
  menu,
  footer,
  href,
  onClick,
  className,
}: CourseCardProps) {
  const body = (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5',
        (href || onClick) && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-chart-5/10">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {/* hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {badge && <div className="absolute right-3 top-3">{badge}</div>}
        {menu && (
          <div
            className="absolute right-2 top-2"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {menu}
          </div>
        )}
        {level && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm">
            {LEVEL_LABELS[level] ?? level}
          </span>
        )}
      </div>

      <CardContent className="p-4">
        {category && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {category}
          </p>
        )}
        <h3 className="line-clamp-2 font-semibold text-foreground">{title}</h3>

        {instructor && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {instructor.firstName?.[0]}
              {instructor.lastName?.[0]}
            </div>
            <span className="truncate text-sm text-muted-foreground">
              {instructor.firstName} {instructor.lastName}
            </span>
          </div>
        )}

        {/* meta row */}
        {(enrollmentCount !== undefined || rating !== undefined || duration !== undefined) && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            {rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            )}
            {enrollmentCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {enrollmentCount}
              </span>
            )}
            {duration !== undefined && duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration} min
              </span>
            )}
          </div>
        )}

        {/* progress bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresi</span>
              <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-chart-5 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
