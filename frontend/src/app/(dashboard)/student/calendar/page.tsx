'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  FileText,
  Video,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studentApi, type UpcomingDeadline } from '@/lib/api/student';
import { liveSessionsApi, type LiveSession } from '@/lib/api/live-sessions';

type CalendarItem =
  | { kind: 'deadline'; date: Date; data: UpcomingDeadline }
  | { kind: 'session'; date: Date; data: LiveSession };

export default function StudentCalendarPage() {
  const router = useRouter();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [deadlinesRes, sessionsRes] = await Promise.all([
        studentApi.getDeadlines(),
        liveSessionsApi.getUpcoming().catch(() => ({ data: [] as LiveSession[] })),
      ]);

      const deadlineItems: CalendarItem[] = (deadlinesRes.data || []).map((d) => ({
        kind: 'deadline',
        date: new Date(d.dueDate),
        data: d,
      }));

      const sessionItems: CalendarItem[] = (sessionsRes.data || []).map((s) => ({
        kind: 'session',
        date: new Date(s.scheduledAt),
        data: s,
      }));

      setItems(
        [...deadlineItems, ...sessionItems].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        )
      );
    } catch (err) {
      console.error('Failed to load calendar:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const dayLabel = (date: Date) => {
    if (isToday(date)) return 'Sot';
    if (isTomorrow(date)) return 'Neser';
    return format(date, 'EEEE, dd MMMM', { locale: sq });
  };

  // group by day
  const grouped = items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const key = format(item.date, 'yyyy-MM-dd');
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalendari</h1>
          <p className="text-muted-foreground mt-1">Afatet dhe sesionet live te ardhshme</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Ngarkimi deshtoi</h2>
            <Button className="mt-4" onClick={loadData}>
              Provo Perseri
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Asnje ngjarje e ardhshme</h3>
            <p className="text-muted-foreground mt-1">
              Nuk keni afate ose sesione live te planifikuara.
            </p>
            <Button className="mt-4" onClick={() => router.push('/student/courses')}>
              Shko te Kurset e Mia
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dayKey, dayItems]) => (
              <div key={dayKey}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {dayLabel(dayItems[0].date)}
                </h2>
                <div className="space-y-3">
                  {dayItems.map((item, i) =>
                    item.kind === 'deadline' ? (
                      <DeadlineRow
                        key={`d-${item.data.id}-${i}`}
                        deadline={item.data}
                        date={item.date}
                        onClick={() =>
                          router.push(
                            `/student/courses/${item.data.courseId}/learn/${item.data.lessonId}`
                          )
                        }
                      />
                    ) : (
                      <SessionRow
                        key={`s-${item.data.id}-${i}`}
                        session={item.data}
                        date={item.date}
                        onClick={() => router.push(`/student/live/${item.data.id}`)}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function DeadlineRow({
  deadline,
  date,
  onClick,
}: {
  deadline: UpcomingDeadline;
  date: Date;
  onClick: () => void;
}) {
  const hoursLeft = differenceInHours(date, new Date());
  const urgent = hoursLeft >= 0 && hoursLeft < 24;

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2.5 bg-warning/15 rounded-lg flex-shrink-0">
          <FileText className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{deadline.title}</p>
          <p className="text-sm text-muted-foreground truncate">{deadline.courseName}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {format(date, 'HH:mm')}
          </span>
          {urgent && <Badge variant="destructive">Urgjent</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRow({
  session,
  date,
  onClick,
}: {
  session: LiveSession;
  date: Date;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2.5 bg-primary/15 rounded-lg flex-shrink-0">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{session.title}</p>
          <p className="text-sm text-muted-foreground truncate">{session.course.title}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {format(date, 'HH:mm')}
          </span>
          {session.status === 'LIVE' ? (
            <Badge variant="destructive">LIVE</Badge>
          ) : (
            <Badge variant="secondary">Sesion Live</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
