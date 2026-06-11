'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { enrollmentsApi, type CourseProgress } from '@/lib/api/enrollments';
import { cn } from '@/lib/utils';

const LESSON_ICONS = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

export default function StudentCourseOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await enrollmentsApi.getCourseProgress(courseId);
      if (res.data) {
        setProgress(res.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to load course progress:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const allLessons = progress?.modules.flatMap((m) => m.lessons) ?? [];
  const nextLesson = allLessons.find((l) => !l.isCompleted) ?? allLessons[0];

  const goToLesson = (lessonId: string) => {
    router.push(`/student/courses/${courseId}/learn/${lessonId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !progress) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Kursi nuk u gjet</h2>
          <p className="text-muted-foreground mt-1">
            Nuk u arrit te ngarkohej ky kurs ose nuk jeni i regjistruar.
          </p>
          <Button className="mt-4" onClick={() => router.push('/student/courses')}>
            Kthehu te Kurset e Mia
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/student/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Permbledhje e Kursit</h1>
            <p className="text-muted-foreground mt-1">
              {progress.completedLessons} nga {progress.totalLessons} mesime te perfunduara
            </p>
          </div>
          {nextLesson && (
            <Button onClick={() => goToLesson(nextLesson.id)}>
              <PlayCircle className="h-4 w-4 mr-2" />
              {progress.completedLessons > 0 ? 'Vazhdo Mesimin' : 'Fillo Kursin'}
            </Button>
          )}
        </div>

        {/* Progress Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Progresi i Pergjithshem</span>
              <span className="text-sm font-semibold text-foreground">
                {Math.round(progress.overallProgress)}%
              </span>
            </div>
            <Progress value={progress.overallProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Modules */}
        <div className="space-y-4">
          {progress.modules.map((module, moduleIndex) => (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <span className="text-muted-foreground mr-2">Moduli {moduleIndex + 1}</span>
                    {module.title}
                  </CardTitle>
                  <Badge variant={module.completedLessons === module.totalLessons ? 'success' : 'secondary'}>
                    {module.completedLessons}/{module.totalLessons}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const Icon = LESSON_ICONS[lesson.type] || FileText;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => goToLesson(lesson.id)}
                        className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2"
                      >
                        {lesson.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60 flex-shrink-0" />
                        )}
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            lesson.isCompleted ? 'text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          {lessonIndex + 1}. {lesson.title}
                        </span>
                        {lesson.duration && (
                          <span className="text-xs text-muted-foreground">
                            {Math.ceil(lesson.duration / 60)} min
                          </span>
                        )}
                        <PlayCircle className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
