'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  Users,
  Target,
  Award,
  Star,
  ArrowLeft,
  Loader2,
  Download,
  BookOpen,
  Clock,
  AlertTriangle,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const chartLoading = () => (
  <div className="h-[280px] animate-pulse rounded-lg bg-slate-100" />
);
const EnrollmentLineChart = dynamic(
  () => import('@/components/charts/EnrollmentLineChart').then((m) => m.EnrollmentLineChart),
  { ssr: false, loading: chartLoading }
);
const ProgressDistributionChart = dynamic(
  () =>
    import('@/components/charts/ProgressDistributionChart').then(
      (m) => m.ProgressDistributionChart
    ),
  { ssr: false, loading: chartLoading }
);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { analyticsApi, type CourseAnalytics } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';

export default function CourseAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [courseId, days]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await analyticsApi.getCourseAnalytics(courseId, days);
      if (res.data) setAnalytics(res.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!analytics) return;

    const rows = [
      ['Metrika', 'Vlera'],
      ['Total Studente', analytics.overview.totalStudents.toString()],
      ['Norma Perfundimit', `${analytics.overview.completionRate}%`],
      ['Rezultati Mesatar', `${analytics.overview.averageScore}%`],
      ['Vleresimi Mesatar', analytics.overview.averageRating.toString()],
      [],
      ['Data', 'Regjistrime'],
      ...analytics.enrollmentOverTime.map((e) => [e.date, e.count.toString()]),
      [],
      ['Moduli', 'Mesime', 'Perfundimi %', 'Koha Mesatare (min)'],
      ...analytics.moduleCompletion.map((m) => [
        m.moduleTitle,
        m.lessonsCount.toString(),
        `${m.completionRate}%`,
        m.avgTimeMinutes.toString(),
      ]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${courseId}-${days}days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="INSTRUCTOR">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout role="INSTRUCTOR">
        <div className="text-center py-12 text-slate-500">
          Nuk u gjet analitika
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/instructor/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kurset
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-2xl font-bold text-slate-900">Analitika e Kursit</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dite</SelectItem>
                <SelectItem value="30">30 dite</SelectItem>
                <SelectItem value="90">90 dite</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Eksporto CSV
            </Button>
          </div>
        </div>

        {/* Row 1 - Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Studente</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.overview.totalStudents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Norma Perfundimit</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.overview.completionRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Rezultat Mesatar Kuizesh</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.overview.averageScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Vleresim Mesatar</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">
                      {analytics.overview.averageRating.toFixed(1)}
                    </p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-4 w-4',
                            star <= Math.round(analytics.overview.averageRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2 - Charts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regjistrime me Kohen</CardTitle>
            </CardHeader>
            <CardContent>
              <EnrollmentLineChart data={analytics.enrollmentOverTime} height={280} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shperndarja e Progresit</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressDistributionChart data={analytics.progressDistribution} height={280} />
            </CardContent>
          </Card>
        </div>

        {/* Row 3 - Module Completion Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Perfundimi sipas Modulit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moduli</TableHead>
                  <TableHead className="text-center">Mesime</TableHead>
                  <TableHead>Perfundimi</TableHead>
                  <TableHead className="text-right">Koha Mesatare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.moduleCompletion.map((module, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{module.moduleTitle}</TableCell>
                    <TableCell className="text-center">{module.lessonsCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={module.completionRate} className="flex-1 h-2" />
                        <span className="text-sm text-slate-600 w-12">
                          {module.completionRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-slate-600">
                        <Clock className="h-4 w-4" />
                        {module.avgTimeMinutes} min
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Row 4 - Two Panels */}
        <div className="grid grid-cols-2 gap-6">
          {/* Hardest Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Pyetjet me te Veshtira
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.hardestQuestions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Ende pa te dhena te mjaftueshme
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.hardestQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-sm text-slate-400 mt-0.5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 line-clamp-2">{q.questionText}</p>
                        <p className="text-xs text-slate-500 mt-1">{q.quizTitle}</p>
                      </div>
                      <Badge variant="destructive" className="flex-shrink-0">
                        {q.wrongAnswerRate}% gabim
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktiviteti i Fundit</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Asnje aktivitet i fundit
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.recentActivity.slice(0, 8).map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full flex-shrink-0',
                          activity.type === 'enrollment' ? 'bg-green-100' : 'bg-indigo-100'
                        )}
                      >
                        {activity.type === 'enrollment' ? (
                          <UserPlus className="h-4 w-4 text-green-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{activity.studentName}</span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                            locale: sq,
                          })}
                        </p>
                      </div>
                    </div>
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
