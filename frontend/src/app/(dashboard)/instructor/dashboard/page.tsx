'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Plus,
  AlertCircle,
  FileText,
  Video,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatGridSkeleton, ListSkeleton } from '@/components/ui/skeletons';
import { coursesApi, type Course } from '@/lib/api/courses';
import { liveSessionsApi, type LiveSession } from '@/lib/api/live-sessions';
import { assignmentsApi } from '@/lib/api/assignments';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<Course['status'], { label: string; variant: 'draft' | 'warning' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'draft' },
  PENDING_REVIEW: { label: 'Ne Pritje', variant: 'warning' },
  PUBLISHED: { label: 'Publikuar', variant: 'success' },
  ARCHIVED: { label: 'Arkivuar', variant: 'destructive' },
};

interface PendingWork {
  courseId: string;
  courseTitle: string;
  ungradedCount: number;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [pendingWork, setPendingWork] = useState<PendingWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        coursesApi.getInstructorCourses(),
        liveSessionsApi.getMySessions().catch(() => ({ data: [] as LiveSession[] })),
      ]);

      const loadedCourses = coursesRes.data || [];
      setCourses(loadedCourses);
      setSessions(sessionsRes.data || []);

      const assignmentResults = await Promise.all(
        loadedCourses.map((c) =>
          assignmentsApi
            .getCourseAssignments(c.id)
            .then((res) => ({ course: c, data: res.data }))
            .catch(() => ({ course: c, data: undefined }))
        )
      );

      const pending: PendingWork[] = [];
      for (const result of assignmentResults) {
        const ungraded = (result.data?.assignments || []).reduce(
          (sum, a) => sum + a.ungradedCount,
          0
        );
        if (ungraded > 0) {
          pending.push({
            courseId: result.course.id,
            courseTitle: result.course.title,
            ungradedCount: ungraded,
          });
        }
      }
      setPendingWork(pending);
    } catch (err) {
      console.error('Failed to load instructor dashboard:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const totalStudents = courses.reduce((sum, c) => sum + (c._count?.enrollments ?? c.enrollmentCount ?? 0), 0);
  const activeCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const ratedCourses = courses.filter((c) => (c.averageRating ?? 0) > 0);
  const avgRating =
    ratedCourses.length > 0
      ? ratedCourses.reduce((sum, c) => sum + (c.averageRating ?? 0), 0) / ratedCourses.length
      : 0;
  const avgCompletion =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + (c.completionRate ?? 0), 0) / courses.length
      : 0;

  const upcomingSessions = sessions
    .filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);

  if (isLoading) {
    return (
      <DashboardLayout role="INSTRUCTOR">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Paneli i Instruktorit</h1>
            <p className="mt-1 text-slate-600">Menaxho kurset dhe studentet e tu</p>
          </div>
          <StatGridSkeleton count={4} />
          <Card>
            <CardHeader>
              <CardTitle>Kurset e Mia</CardTitle>
            </CardHeader>
            <CardContent>
              <ListSkeleton rows={4} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="INSTRUCTOR">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900">Ngarkimi deshtoi</h2>
          <p className="text-slate-500 mt-1">Nuk u arrit te ngarkohen te dhenat e panelit.</p>
          <Button className="mt-4" onClick={loadData}>
            Provo Perseri
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Paneli i Instruktorit</h1>
            <p className="text-slate-500 mt-1">Menaxho kurset dhe studentet e tu</p>
          </div>
          <Button onClick={() => router.push('/instructor/courses')}>
            <Plus className="h-4 w-4 mr-2" />
            Krijo Kurs
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Studente Gjithsej"
            value={totalStudents}
            icon={Users}
            color="indigo"
          />
          <StatCard label="Kurse Aktive" value={activeCourses} icon={BookOpen} color="blue" />
          <StatCard
            label="Vleresimi Mesatar"
            value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
            icon={Star}
            color="amber"
          />
          <StatCard
            label="Norma e Perfundimit"
            value={`${Math.round(avgCompletion)}%`}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* My Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kurset e Mia</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/instructor/courses')}>
              Shiko te gjitha
            </Button>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-900">Asnje kurs ende</p>
                <p className="text-sm text-slate-500 mt-1">
                  Krijo kursin tend te pare per te filluar.
                </p>
                <Button className="mt-4" onClick={() => router.push('/instructor/courses')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Krijo Kurs te Ri
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{course.title}</p>
                      <p className="text-sm text-slate-500">
                        {(course._count?.enrollments ?? course.enrollmentCount ?? 0)} studente
                        {(course.averageRating ?? 0) > 0 &&
                          ` • ${course.averageRating?.toFixed(1)} vleresim`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_CONFIG[course.status].variant}>
                        {STATUS_CONFIG[course.status].label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/instructor/courses/${course.id}/edit`)}
                      >
                        Redakto
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Work */}
          <Card>
            <CardHeader>
              <CardTitle>Veprime te Kerkuara</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingWork.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>Asnje detyre per t&apos;u vleresuar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWork.map((work) => (
                    <button
                      key={work.courseId}
                      onClick={() =>
                        router.push(`/instructor/courses/${work.courseId}/assignments`)
                      }
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{work.courseTitle}</p>
                        <p className="text-xs text-slate-500">
                          {work.ungradedCount} dorezime pa vleresuar
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sesionet e Ardhshme</CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push('/instructor/live')}>
                Shiko te gjitha
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>Asnje sesion i planifikuar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => router.push(`/instructor/live/${session.id}`)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors',
                        session.status === 'LIVE'
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{session.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(session.scheduledAt), 'dd MMM yyyy, HH:mm', {
                            locale: sq,
                          })}
                        </p>
                      </div>
                      {session.status === 'LIVE' ? (
                        <Badge variant="destructive">LIVE</Badge>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
