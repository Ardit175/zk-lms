'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  GraduationCap,
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Users,
  Star,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showErrorToast, showSuccessToast } from '@/lib/api';
import { coursesApi } from '@/lib/api/courses';
import { enrollmentsApi } from '@/lib/api/enrollments';
import { useAuthStore } from '@/stores/auth-store';

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Fillestar',
  INTERMEDIATE: 'Mesatar',
  ADVANCED: 'Avancuar',
};

const LESSON_ICONS = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

interface PreviewLesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  duration: number | null;
  isPreview: boolean;
}

interface PreviewModule {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: PreviewLesson[];
}

interface CoursePreview {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnailUrl: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  totalDuration: number;
  enrollmentCount: number;
  averageRating: number;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  category: { id: string; name: string; slug: string } | null;
  modules: PreviewModule[];
}

export default function PublicCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<CoursePreview | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await coursesApi.getCourseBySlug(slug);
        if (res.success && res.data) {
          setCourse(res.data as unknown as CoursePreview);

          if (isAuthenticated && user?.role === 'STUDENT') {
            try {
              const enrRes = await enrollmentsApi.getMyEnrollments();
              if (enrRes.success && enrRes.data) {
                setIsEnrolled(
                  enrRes.data.some((e) => e.courseId === (res.data as unknown as CoursePreview).id)
                );
              }
            } catch {
              // ignore — treat as not enrolled
            }
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load course:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug, isAuthenticated, user?.role]);

  const handleEnroll = async () => {
    if (!course) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (user?.role !== 'STUDENT') {
      showErrorToast('Vetem studentet mund te regjistrohen ne kurse');
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await enrollmentsApi.enroll(course.id);
      if (res.success) {
        showSuccessToast('U regjistrove me sukses ne kurs!');
        router.push(`/student/courses/${course.id}`);
      } else {
        showErrorToast(res.error || 'Regjistrimi deshtoi');
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Regjistrimi deshtoi';
      // If user is already enrolled, just send them to the course
      if (message.includes('tashme')) {
        router.push(`/student/courses/${course.id}`);
        return;
      }
      showErrorToast(message);
    } finally {
      setIsEnrolling(false);
    }
  };

  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 text-white shadow-sm shadow-primary/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">EduAI</span>
          </Link>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href={
                  user?.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user?.role === 'INSTRUCTOR'
                      ? '/instructor/dashboard'
                      : '/student/dashboard'
                }
              >
                <Button>Paneli Kryesor</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Hyr</Button>
                </Link>
                <Link href="/register">
                  <Button>Fillo Tani</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-16">
        {isLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !course ? (
          <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
            <h2 className="text-xl font-semibold text-foreground">Kursi nuk u gjet</h2>
            <p className="mt-1 text-muted-foreground">
              Ky kurs nuk ekziston ose nuk eshte publik.
            </p>
            <Button className="mt-4" onClick={() => router.push('/courses')}>
              Shfleto Kurset
            </Button>
          </div>
        ) : (
          <>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 py-16">
              <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
              <div className="container relative mx-auto px-4">
                <Button
                  variant="ghost"
                  className="mb-4 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => router.push('/courses')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Te gjitha kurset
                </Button>
                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {course.category && (
                        <Badge className="bg-white/20 text-white hover:bg-white/30">
                          {course.category.name}
                        </Badge>
                      )}
                      <Badge className="bg-white/20 text-white hover:bg-white/30">
                        {LEVEL_LABELS[course.level] ?? course.level}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">
                      {course.title}
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-indigo-100">
                      {course.description}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                          {course.instructor.firstName?.[0]}
                          {course.instructor.lastName?.[0]}
                        </div>
                        <span>
                          {course.instructor.firstName} {course.instructor.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                        <span>
                          {course.averageRating > 0
                            ? course.averageRating.toFixed(1)
                            : 'I pavleresuar'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollmentCount} studente</span>
                      </div>
                      {course.totalDuration > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{course.totalDuration} min</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enrollment card */}
                  <div>
                    <Card className="shadow-xl">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <p className="text-3xl font-bold text-foreground">Falas</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Akses i plote pas regjistrimit
                          </p>
                        </div>

                        {isEnrolled ? (
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => router.push(`/student/courses/${course.id}`)}
                          >
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Vazhdo Mesimin
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleEnroll}
                            disabled={isEnrolling}
                          >
                            {isEnrolling ? (
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <PlayCircle className="mr-2 h-5 w-5" />
                            )}
                            {!isAuthenticated
                              ? 'Hyr per t\'u Regjistruar'
                              : user?.role !== 'STUDENT'
                                ? 'Vetem Studentet Regjistrohen'
                                : 'Regjistrohu Tani'}
                          </Button>
                        )}

                        <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span>
                              {course.modules.length} module · {totalLessons} mesime
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span>Certifikate ne perfundim</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>Akses pa kufi</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </section>

            {/* Curriculum */}
            <section className="bg-muted/50 py-12">
              <div className="container mx-auto px-4">
                <div className="mx-auto max-w-3xl">
                  <h2 className="mb-6 text-2xl font-bold text-foreground">
                    Permbajtja e Kursit
                  </h2>

                  {course.modules.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center text-muted-foreground">
                        Asnje modul i publikuar ende.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {course.modules.map((module, idx) => (
                        <Card key={module.id}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              <span className="mr-2 text-muted-foreground">
                                Moduli {idx + 1}
                              </span>
                              {module.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {module.lessons.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Asnje mesim ende.
                              </p>
                            ) : (
                              <div className="divide-y divide-border">
                                {module.lessons.map((lesson, lIdx) => {
                                  const Icon = LESSON_ICONS[lesson.type] || FileText;
                                  return (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center gap-3 py-3"
                                    >
                                      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                      <span className="flex-1 text-sm text-foreground">
                                        {lIdx + 1}. {lesson.title}
                                      </span>
                                      {lesson.duration && (
                                        <span className="text-xs text-muted-foreground">
                                          {Math.ceil(lesson.duration / 60)} min
                                        </span>
                                      )}
                                      {lesson.isPreview ? (
                                        <Badge variant="secondary" className="text-xs">
                                          Preview
                                        </Badge>
                                      ) : (
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 text-muted-foreground">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            &copy; 2026 EduAI · Projekt Diplome · Universiteti i Tiranes
          </p>
        </div>
      </footer>
    </div>
  );
}
