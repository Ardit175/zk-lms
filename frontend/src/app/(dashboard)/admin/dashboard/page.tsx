'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  adminApi,
  type AdminStats,
  type ChartDataPoint,
  type TopCourse,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [enrollmentChart, setEnrollmentChart] = useState<ChartDataPoint[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, chartRes, topRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getEnrollmentChart(),
        adminApi.getTopCourses(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (chartRes.data) setEnrollmentChart(chartRes.data);
      if (topRes.data) setTopCourses(topRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewCourse = (courseId: string) => {
    router.push(`/admin/courses/${courseId}/review`);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Pasqyra e statistikave te platformes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Perdorues"
            value={stats?.users.total || 0}
            icon={Users}
            subtitle={`${stats?.users.admins || 0} admin, ${stats?.users.instructors || 0} instruktor, ${stats?.users.students || 0} studente`}
          />
          <StatsCard
            title="Total Kurse"
            value={stats?.courses.total || 0}
            icon={BookOpen}
            subtitle={`${stats?.courses.published || 0} publikuar, ${stats?.courses.draft || 0} draft`}
          />
          <StatsCard
            title="Regjistrime (Muaji)"
            value={stats?.enrollments.thisMonth || 0}
            icon={GraduationCap}
            change={stats?.enrollments.changePercent || 0}
          />
          <StatsCard
            title="Ne Pritje per Rishikim"
            value={stats?.courses.pendingReview || 0}
            icon={Clock}
            urgent={stats?.courses.pendingReview ? stats.courses.pendingReview > 5 : false}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Regjistrimet (30 ditet e fundit)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('sq-AL');
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Kurset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCourses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tick={{ fontSize: 12 }}
                      width={150}
                      tickFormatter={(value) =>
                        value.length > 20 ? `${value.slice(0, 20)}...` : value
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="enrollmentCount" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Review Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kurse ne Pritje per Rishikim</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/courses?status=PENDING_REVIEW')}>
              Shiko te gjitha
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.pendingReviewCourses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nuk ka kurse ne pritje per rishikim
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.pendingReviewCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{course.title}</p>
                      <p className="text-sm text-slate-500">
                        Nga {course.instructor.firstName} {course.instructor.lastName} •{' '}
                        {new Date(course.updatedAt).toLocaleDateString('sq-AL')}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleReviewCourse(course.id)}>
                      Rishiko
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  subtitle?: string;
  change?: number;
  urgent?: boolean;
}

function StatsCard({ title, value, icon: Icon, subtitle, change, urgent }: StatsCardProps) {
  return (
    <Card className={cn(urgent && 'border-amber-300 bg-amber-50')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', urgent ? 'text-amber-500' : 'text-slate-400')} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</span>
          {urgent && (
            <Badge variant="warning" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Urgjent
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs mt-1',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{change >= 0 ? '+' : ''}{change}% nga muaji i kaluar</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
