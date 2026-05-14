'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
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
    if (hours < 24) return 'bg-red-100 text-red-700';
    if (hours < 72) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (isLoading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Miresevjen!</h1>
          <p className="text-slate-500 mt-1">Vazhdo udhetimin tend te mesimit</p>
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
                  className="ml-auto bg-white text-green-600 hover:bg-green-50"
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
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${continueLearning.progressPercent}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
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
          <Card className="bg-gradient-to-r from-slate-100 to-slate-50 border-dashed">
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Fillo udhetimin tend</h2>
              <p className="text-slate-500 mb-4">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.studyHours}</p>
                    <p className="text-xs text-slate-500">Ore Studimi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.quizzesCompleted}</p>
                    <p className="text-xs text-slate-500">Kuize te Kryera</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.averageQuizScore}%</p>
                    <p className="text-xs text-slate-500">Mesatarja</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Flame className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.streakDays}</p>
                    <p className="text-xs text-slate-500">Dite Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <div className="text-center py-8 text-slate-500">
                  Asnje kurs ne kete kategori
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEnrollments.map((enrollment) => (
                    <Link
                      key={enrollment.id}
                      href={`/student/courses/${enrollment.courseId}`}
                      className="block"
                    >
                      <div className="p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {enrollment.course.thumbnailUrl ? (
                            <img
                              src={enrollment.course.thumbnailUrl}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 truncate">{enrollment.course.title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                              Nga {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                            </p>
                          </div>
                          {enrollment.status === 'COMPLETED' && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Perfunduar
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Progresi</span>
                            <span className="text-slate-900 font-medium">{Math.round(enrollment.progressPercent)}%</span>
                          </div>
                          <Progress value={enrollment.progressPercent} className="h-2" />
                        </div>
                        {enrollment.lastAccessedAt && (
                          <p className="text-xs text-slate-400 mt-2">
                            Aksesuar {formatDistanceToNow(new Date(enrollment.lastAccessedAt), { locale: sq, addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </Link>
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
                <Calendar className="h-5 w-5 text-slate-400" />
                Afatet e Ardhshme
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>Asnje afat ne 7 ditet e ardhshme</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => (
                    <Link
                      key={deadline.id}
                      href={`/student/courses/${deadline.courseId}/learn/${deadline.lessonId}`}
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{deadline.title}</p>
                          <p className="text-xs text-slate-500">{deadline.courseName}</p>
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
                <Video className="h-5 w-5 text-slate-400" />
                Sesionet Live
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>Asnje sesion i planifikuar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{session.title}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(session.scheduledAt), 'dd MMM, HH:mm', { locale: sq })}
                        </p>
                      </div>
                      {session.status === 'LIVE' ? (
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => router.push(`/student/live/${session.id}`)}
                        >
                          <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
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
                <Target className="h-5 w-5 text-slate-400" />
                Kompetencat e Mia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={competencies}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Radar
                      name="Rezultati"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm text-slate-500">
                {competencies.map((comp) => (
                  <div key={comp.category} className="text-center">
                    <p className="font-medium text-slate-700">{comp.category}</p>
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
