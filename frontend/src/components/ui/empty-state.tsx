import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-6', className)}>
      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
        <Icon className="h-12 w-12 text-indigo-600" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 max-w-sm mb-6">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
