import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatColor = 'indigo' | 'green' | 'amber' | 'purple' | 'red' | 'blue';

const COLOR_MAP: Record<StatColor, string> = {
  indigo: 'bg-indigo-100 text-indigo-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
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
  className,
}: StatCardProps) {
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', COLOR_MAP[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'mt-3 flex items-center gap-1 text-xs font-medium',
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>
              {trend >= 0 ? '+' : ''}
              {trend}% {trendLabel}
            </span>
          </div>
        )}
        {subtitle && trend === undefined && (
          <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
