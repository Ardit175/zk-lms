'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { sq } from 'date-fns/locale';
import dynamic from 'next/dynamic';

const CompetencyRadarChart = dynamic(
  () => import('@/components/charts/CompetencyRadarChart').then((m) => m.CompetencyRadarChart),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted" /> }
);
import {
  Clock,
  BookOpen,
  Award,
  Flame,
  Play,
  Calendar,
  Video,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
  GraduationCap,
  Target,
  Trophy,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { StatGridSkeleton, ListSkeleton } from '@/components/ui/skeletons';
import { CourseCard } from '@/components/course/CourseCard';
import { studentApi, StudentStats, UpcomingDeadline, Competency, ContinueLearning } from '@/lib/api/student';
import { enrollmentsApi, Enrollment } from '@/lib/api/enrollments';
import { liveSessionsApi, LiveSession } from '@/lib/api/live-sessions';
import { cn } from '@/lib/utils';

type CourseFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export default function StudentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCompleted = searchParams.get('completed') === 'true';

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [continueLearning, setContinueLearning] = useState<ContinueLearning | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statsRes,
          continueRes,
          enrollmentsRes,
          deadlinesRes,
          liveRes,
          competenciesRes,
        ] = await Promise.all([
          studentApi.getStats(),
          studentApi.getContinueLearning(),
          enrollmentsApi.getMyEnrollments(),
          studentApi.getDeadlines(),
          liveSessionsApi.getUpcoming().catch(() => ({ data: [] })),
          studentApi.getCompetencies(),
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (continueRes.data) setContinueLearning(continueRes.data);
        if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data);
        if (deadlinesRes.data) setDeadlines(deadlinesRes.data);
        if (liveRes.data) setLiveSessions(liveRes.data.slice(0, 3));
        if (competenciesRes.data) setCompetencies(competenciesRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (courseFilter === 'ALL') return true;
    return enrollment.status === courseFilter;
  });

  const getDeadlineColor = (dueDate: string) => {
    const hours = differenceInHours(new Date(dueDate), new Date());
    if (hours < 24) return "bg-destructive/15 text-destructive";
    if (hours < 72) return "bg-warning/15 text-warning";
    return "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Miresevjen!</h1>
            <p className="mt-1 text-muted-foreground">Vazhdo udhetimin tend te mesimit</p>
          </div>
          <StatGridSkeleton count={4} />
          <Card>
            <CardHeader>
              <CardTitle>Kurset e Mia</CardTitle>
            </CardHeader>
            <CardContent>
              <ListSkeleton rows={3} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Miresevjen!</h1>
          <p className="text-muted-foreground mt-1">Vazhdo udhetimin tend te mesimit</p>
        </div>

        {/* Course Completion Celebration */}
        {justCompleted && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Urime! Kursi u perfundua!</h2>
                  <p className="text-green-100">Certifikata juaj eshte gati per shkarkim.</p>
                </div>
                <Button
                  variant="secondary"
                  className="ml-auto bg-card text-success hover:bg-success/10"
                  onClick={() => router.push('/student/certificates')}
                >
                  Shiko Certifikatat
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Learning */}
        {continueLearning && (
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-indigo-100 text-sm">Vazhdo Mesimin</p>
                  <h2 className="text-xl font-bold mt-1">{continueLearning.courseTitle}</h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    {Math.round(continueLearning.progressPercent)}% perfunduar • Nga {continueLearning.instructorName}
                  </p>
                  <div className="mt-4 h-2 w-64 bg-indigo-400 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-card rounded-full transition-all"
                      style={{ width: `${continueLearning.progressPercent}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-card text-primary hover:bg-primary/10"
                  onClick={() => {
                    if (continueLearning.nextLessonId) {
                      router.push(`/student/courses/${continueLearning.courseId}/learn/${continueLearning.nextLessonId}`);
                    }
                  }}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Vazhdo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Enrollments CTA */}
        {!continueLearning && enrollments.length === 0 && (
          <Card className="bg-gradient-to-r from-muted to-muted/40 border-dashed">
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Fillo udhetimin tend</h2>
              <p className="text-muted-foreground mb-4">
                Nuk je i regjistruar ne asnje kurs ende. Shfleto kurset tona dhe fillo te mesosh sot!
              </p>
              <Button onClick={() => router.push('/courses')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Shfleto Kurset
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ore Studimi" value={stats.studyHours} icon={Clock} color="indigo" />
            <StatCard
              label="Kuize te Kryera"
              value={stats.quizzesCompleted}
              icon={Target}
              color="green"
            />
            <StatCard
              label="Rezultati Mesatar"
              value={`${stats.averageQuizScore}%`}
              icon={Award}
              color="amber"
            />
            <StatCard label="Dite Streak" value={stats.streakDays} icon={Flame} color="red" />
          </div>
        )}

        {/* My Courses */}
        {enrollments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kurset e Mia</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={courseFilter === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCourseFilter('ALL')}
                >
                  Te gjitha
                </Button>
                <Button
                  variant={courseFilter === 'ACTIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCourseFilter('ACTIVE')}
                >
                  Ne progres
                </Button>
                <Button
                  variant={courseFilter === 'COMPLETED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCourseFilter('COMPLETED')}
                >
                  Perfunduar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Asnje kurs ne kete kategori
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEnrollments.map((enrollment) => (
                    <CourseCard
                      key={enrollment.id}
                      href={`/student/courses/${enrollment.courseId}`}
                      title={enrollment.course.title}
                      thumbnailUrl={enrollment.course.thumbnailUrl}
                      instructor={enrollment.course.instructor}
                      progress={enrollment.progressPercent}
                      badge={
                        enrollment.status === 'COMPLETED' ? (
                          <Badge variant="success">Perfunduar</Badge>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Afatet e Ardhshme
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p>Asnje afat ne 7 ditet e ardhshme</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => (
                    <Link
                      key={deadline.id}
                      href={`/student/courses/${deadline.courseId}/learn/${deadline.lessonId}`}
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">{deadline.courseName}</p>
                        </div>
                        <Badge className={getDeadlineColor(deadline.dueDate)}>
                          {formatDistanceToNow(new Date(deadline.dueDate), { locale: sq, addSuffix: true })}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Live Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-muted-foreground" />
                Sesionet Live
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p>Asnje sesion i planifikuar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.scheduledAt), 'dd MMM, HH:mm', { locale: sq })}
                        </p>
                      </div>
                      {session.status === 'LIVE' ? (
                        <Button
                          size="sm"
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => router.push(`/student/live/${session.id}`)}
                        >
                          <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-card opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-card"></span>
                          </span>
                          Bashkohu
                        </Button>
                      ) : (
                        <Badge variant="outline">
                          {formatDistanceToNow(new Date(session.scheduledAt), { locale: sq, addSuffix: true })}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Competency Radar Chart */}
        {competencies.length >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                Kompetencat e Mia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompetencyRadarChart data={competencies} />
              <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
                {competencies.map((comp) => (
                  <div key={comp.category} className="text-center">
                    <p className="font-medium text-foreground">{comp.category}</p>
                    <p>{comp.score}% ({comp.quizzesTaken} kuize)</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
