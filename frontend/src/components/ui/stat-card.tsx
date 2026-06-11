'use client';

import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from '@/components/ui/count-up';
import { cn } from '@/lib/utils';

type StatColor = 'indigo' | 'green' | 'amber' | 'purple' | 'red' | 'blue';

// Tinted icon chips that read correctly on both themes (soft fill + saturated glyph).
const COLOR_MAP: Record<StatColor, string> = {
  indigo: 'bg-primary/10 text-primary',
  green: 'bg-success/10 text-success',
  amber: 'bg-warning/15 text-warning',
  purple: 'bg-chart-5/15 text-chart-5',
  red: 'bg-destructive/10 text-destructive',
  blue: 'bg-info/10 text-info',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: StatColor;
  /** percentage change vs previous period */
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  /** value suffix shown after the (animated) number, e.g. "%" or "h" */
  suffix?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'indigo',
  trend,
  trendLabel = 'nga muaji i kaluar',
  subtitle,
  suffix,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5',
        className
      )}
    >
      {/* accent wash that brightens on hover */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:opacity-80 opacity-0" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
              {typeof value === 'number' ? (
                <CountUp value={value} suffix={suffix} />
              ) : (
                <>
                  {value}
                  {suffix}
                </>
              )}
            </p>
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', COLOR_MAP[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'mt-3 flex items-center gap-1 text-xs font-medium',
              trend >= 0 ? 'text-success' : 'text-destructive'
            )}
          >
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {trend >= 0 ? '+' : ''}
              {trend}% {trendLabel}
            </span>
          </div>
        )}
        {subtitle && trend === undefined && <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
