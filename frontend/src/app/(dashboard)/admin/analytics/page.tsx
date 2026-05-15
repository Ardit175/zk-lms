'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Users, BookOpen, GraduationCap, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  adminApi,
  type AdminStats,
  type ChartDataPoint,
  type TopCourse,
} from '@/lib/api/admin';

const chartLoading = () => (
  <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />
);
const EnrollmentLineChart = dynamic(
  () => import('@/components/charts/EnrollmentLineChart').then((m) => m.EnrollmentLineChart),
  { ssr: false, loading: chartLoading }
);
const TopCoursesChart = dynamic(
  () => import('@/components/charts/TopCoursesChart').then((m) => m.TopCoursesChart),
  { ssr: false, loading: chartLoading }
);

export default function AdminAnalyticsPage() {
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
      console.error('Failed to load analytics:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900">Ngarkimi deshtoi</h2>
          <p className="text-slate-500 mt-1">Nuk u arrit te ngarkohej analitika.</p>
          <Button className="mt-4" onClick={loadData}>
            Provo Perseri
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const userBreakdown = [
    { label: 'Administratore', value: stats.users.admins, total: stats.users.total },
    { label: 'Instruktore', value: stats.users.instructors, total: stats.users.total },
    { label: 'Studente', value: stats.users.students, total: stats.users.total },
  ];

  const courseBreakdown = [
    { label: 'Publikuar', value: stats.courses.published, color: 'bg-green-500' },
    { label: 'Ne Pritje', value: stats.courses.pendingReview, color: 'bg-amber-500' },
    { label: 'Draft', value: stats.courses.draft, color: 'bg-slate-400' },
    { label: 'Arkivuar', value: stats.courses.archived, color: 'bg-red-400' },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analitika</h1>
          <p className="text-slate-500 mt-1">Pasqyre e detajuar e platformes</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard label="Perdorues Gjithsej" value={stats.users.total} icon={Users} />
          <SummaryCard label="Kurse Gjithsej" value={stats.courses.total} icon={BookOpen} />
          <SummaryCard
            label="Regjistrime (Muaji)"
            value={stats.enrollments.thisMonth}
            icon={GraduationCap}
          />
          <SummaryCard
            label="Ndryshimi Mujor"
            value={`${stats.enrollments.changePercent >= 0 ? '+' : ''}${stats.enrollments.changePercent}%`}
            icon={TrendingUp}
          />
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Shperndarja e Perdoruesve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userBreakdown.map((item) => {
                const percent = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">
                        {item.value} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statusi i Kurseve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseBreakdown.map((item) => {
                const percent =
                  stats.courses.total > 0
                    ? Math.round((item.value / stats.courses.total) * 100)
                    : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">
                        {item.value} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
