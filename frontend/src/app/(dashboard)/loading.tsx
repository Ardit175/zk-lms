import { Skeleton } from '@/components/ui/skeleton';
import { StatGridSkeleton } from '@/components/ui/skeletons';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-muted/50">
      {/* sidebar placeholder */}
      <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2 p-3 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* content placeholder */}
      <div className="pl-64">
        <div className="h-14 border-b border-border bg-card" />
        <div className="space-y-8 p-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <StatGridSkeleton count={4} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
