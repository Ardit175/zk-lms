'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Users, BookOpen, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Reveal } from '@/components/ui/reveal';
import { StatGridSkeleton, ChartSkeleton } from '@/components/ui/skeletons';
import {
  adminApi,
  type AdminStats,
  type ChartDataPoint,
  type TopCourse,
} from '@/lib/api/admin';

const chartLoading = () => (
  <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
);
const EnrollmentLineChart = dynamic(
  () => import('@/components/charts/EnrollmentLineChart').then((m) => m.EnrollmentLineChart),
  { ssr: false, loading: chartLoading }
);
const TopCoursesChart = dynamic(
  () => import('@/components/charts/TopCoursesChart').then((m) => m.TopCoursesChart),
  { ssr: false, loading: chartLoading }
);

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [enrollmentChart, setEnrollmentChart] = useState<ChartDataPoint[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [statsRes, chartRes, topRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getEnrollmentChart(),
        adminApi.getTopCourses(),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (chartRes.data) setEnrollmentChart(chartRes.data);
      if (topRes.data) setTopCourses(topRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Paneli i Administratorit</h1>
          <p className="mt-1 text-muted-foreground">Pasqyra e statistikave te platformes</p>
        </div>

        {isLoading ? (
          <>
            <StatGridSkeleton count={4} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive/70" />
            <h2 className="text-lg font-semibold text-foreground">Ngarkimi deshtoi</h2>
            <p className="mt-1 text-muted-foreground">Nuk u arriten te ngarkohen te dhenat.</p>
            <Button className="mt-4" onClick={loadData}>
              Provo Perseri
            </Button>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                <StatCard key="u" label="Perdorues Gjithsej" value={stats?.users.total ?? 0} icon={Users} color="indigo"
                  subtitle={`${stats?.users.admins ?? 0} admin · ${stats?.users.instructors ?? 0} instruktor · ${stats?.users.students ?? 0} student`} />,
                <StatCard key="c" label="Kurse Gjithsej" value={stats?.courses.total ?? 0} icon={BookOpen} color="blue"
                  subtitle={`${stats?.courses.published ?? 0} publikuar · ${stats?.courses.draft ?? 0} draft`} />,
                <StatCard key="e" label="Regjistrime (Muaji)" value={stats?.enrollments.thisMonth ?? 0} icon={GraduationCap} color="green"
                  trend={stats?.enrollments.changePercent ?? 0} />,
                <StatCard key="p" label="Ne Pritje per Rishikim" value={stats?.courses.pendingReview ?? 0} icon={Clock} color="amber"
                  subtitle="Kurse qe presin aprovim" />,
              ].map((card, i) => (
                <Reveal key={i} delay={i * 0.07}>{card}</Reveal>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Regjistrimet (30 ditet e fundit)</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnrollmentLineChart data={enrollmentChart} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Kurset</CardTitle>
                </CardHeader>
                <CardContent>
                  <TopCoursesChart data={topCourses} />
                </CardContent>
              </Card>
            </div>

            {/* Pending review */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kurse ne Pritje per Rishikim</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/courses?status=PENDING_REVIEW')}
                >
                  Shiko te gjitha
                </Button>
              </CardHeader>
              <CardContent>
                {!stats?.pendingReviewCourses.length ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nuk ka kurse ne pritje per rishikim
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.pendingReviewCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Nga {course.instructor.firstName} {course.instructor.lastName} ·{' '}
                            {new Date(course.updatedAt).toLocaleDateString('sq-AL')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/courses/${course.id}/review`)}
                        >
                          Rishiko
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
