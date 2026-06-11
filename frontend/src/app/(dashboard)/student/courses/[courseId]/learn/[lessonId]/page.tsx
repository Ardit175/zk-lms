'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, X, ChevronRight, PanelRightOpen, PanelRightClose, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import {
  CourseNavigation,
  VideoPlayer,
  TextContent,
  QuizPlayer,
  AssignmentPlayer,
} from '@/components/course-player';

// react-pdf can't be evaluated during SSR (pdfjs-dist hits
// `Object.defineProperty called on non-object`), so load it client-side only.
const PdfViewer = dynamic(
  () => import('@/components/course-player/PdfViewer').then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
    ),
  }
);
import { enrollmentsApi, type CourseProgress, type ModuleProgress } from '@/lib/api/enrollments';
import { cn } from '@/lib/utils';

interface LessonData {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  content?: string;
  videoUrl?: string;
  videoType?: 'YOUTUBE' | 'VIMEO' | 'UPLOAD' | null;
  pdfUrl?: string | null;
  quizId?: string | null;
  duration: number | null;
  isCompleted: boolean;
  moduleTitle: string;
}

export default function CoursePlayerPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const res = await enrollmentsApi.getCourseProgress(courseId);
      if (res.data) {
        setProgress(res.data);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      router.push('/student/dashboard');
    }
  }, [courseId, router]);

  useEffect(() => {
    loadProgress().finally(() => setIsLoading(false));
  }, [loadProgress]);

  useEffect(() => {
    if (!progress) return;

    for (const module of progress.modules) {
      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        setCurrentLesson({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          videoType: lesson.videoType,
          pdfUrl: lesson.pdfUrl,
          quizId: lesson.quizId,
          duration: lesson.duration,
          isCompleted: lesson.isCompleted,
          moduleTitle: module.title,
        });
        break;
      }
    }
  }, [progress, lessonId]);

  const navigationModules = useMemo(() => {
    if (!progress) return [];

    let previousModuleCompleted = true;

    return progress.modules.map((module) => {
      const isModuleLocked = !previousModuleCompleted;
      let previousLessonCompleted = !isModuleLocked;

      const lessons = module.lessons.map((lesson) => {
        const isLessonLocked = !previousLessonCompleted;
        if (lesson.isCompleted) {
          previousLessonCompleted = true;
        } else if (lesson.id === lessonId) {
          previousLessonCompleted = false;
        } else {
          previousLessonCompleted = false;
        }

        return {
          ...lesson,
          isLocked: isLessonLocked && lesson.id !== lessonId,
        };
      });

      if (module.completedLessons === module.totalLessons) {
        previousModuleCompleted = true;
      } else {
        previousModuleCompleted = false;
      }

      return {
        ...module,
        lessons,
        isLocked: isModuleLocked,
      };
    });
  }, [progress, lessonId]);

  const findNextLesson = useCallback((): string | null => {
    if (!progress) return null;

    let foundCurrent = false;
    for (const module of progress.modules) {
      for (const lesson of module.lessons) {
        if (foundCurrent) {
          return lesson.id;
        }
        if (lesson.id === lessonId) {
          foundCurrent = true;
        }
      }
    }
    return null;
  }, [progress, lessonId]);

  const handleLessonComplete = async () => {
    try {
      const res = await enrollmentsApi.markLessonComplete(courseId, lessonId);

      if (res.data?.courseCompleted) {
        setTimeout(() => {
          router.push('/student/dashboard?completed=true');
        }, 2000);
        return;
      }

      await loadProgress();

      const nextLessonId = findNextLesson();
      if (nextLessonId) {
        setIsNavigating(true);
        setTimeout(() => {
          router.push(`/student/courses/${courseId}/learn/${nextLessonId}`);
          setIsNavigating(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    }
  };

  const handleLessonClick = (newLessonId: string) => {
    if (newLessonId !== lessonId) {
      router.push(`/student/courses/${courseId}/learn/${newLessonId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!progress || !currentLesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Mesimi nuk u gjet</p>
          <Button onClick={() => router.push('/student/dashboard')}>
            Kthehu ne Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/student/dashboard')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{currentLesson.moduleTitle}</span>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium text-foreground">
              {currentLesson.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.overallProgress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">
              {progress.overallProgress}%
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/student/dashboard')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <CourseNavigation
            modules={navigationModules}
            currentLessonId={lessonId}
            onLessonClick={handleLessonClick}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className={cn(
            'max-w-4xl mx-auto transition-all',
            isRightPanelOpen && 'lg:mr-80'
          )}>
            {isNavigating && (
              <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-success" />
                <span className="text-success">
                  Duke shkuar te mesimi tjeter...
                </span>
              </div>
            )}

            {currentLesson.type === 'VIDEO' && currentLesson.videoUrl && (
              <VideoPlayer
                videoUrl={currentLesson.videoUrl}
                videoType={currentLesson.videoType}
                lessonId={currentLesson.id}
                onComplete={handleLessonComplete}
              />
            )}

            {currentLesson.type === 'TEXT' && currentLesson.pdfUrl && (
              <PdfViewer
                pdfUrl={currentLesson.pdfUrl}
                isCompleted={currentLesson.isCompleted}
                onComplete={handleLessonComplete}
              />
            )}

            {currentLesson.type === 'TEXT' && !currentLesson.pdfUrl && (
              <TextContent
                content={currentLesson.content || '<p>Permbajtja nuk eshte e disponueshme.</p>'}
                isCompleted={currentLesson.isCompleted}
                onComplete={handleLessonComplete}
              />
            )}

            {currentLesson.type === 'QUIZ' && currentLesson.quizId && (
              <QuizPlayer
                quizId={currentLesson.quizId}
                onComplete={(passed) => {
                  if (passed) {
                    handleLessonComplete();
                  }
                }}
              />
            )}

            {currentLesson.type === 'ASSIGNMENT' && (
              <AssignmentPlayer
                lessonId={currentLesson.id}
                onComplete={handleLessonComplete}
              />
            )}
          </div>
        </main>

        {/* Right Panel - Lesson Info */}
        <aside
          className={cn(
            'w-80 bg-card border-l border-border flex-shrink-0 overflow-y-auto transition-all hidden lg:block',
            isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Detajet e Mesimit</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRightPanelOpen(false)}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Titulli</p>
                <p className="font-medium text-foreground">{currentLesson.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Moduli</p>
                <p className="text-foreground">{currentLesson.moduleTitle}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipi</p>
                <p className="text-foreground capitalize">{currentLesson.type.toLowerCase()}</p>
              </div>

              {currentLesson.duration && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kohezgjatja</p>
                  <p className="text-foreground">
                    {Math.floor(currentLesson.duration / 60)} min{' '}
                    {currentLesson.duration % 60} sek
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Statusi</p>
                <p
                  className={cn(
                    'font-medium',
                    currentLesson.isCompleted ? 'text-success' : 'text-warning'
                  )}
                >
                  {currentLesson.isCompleted ? 'Perfunduar' : 'Ne progres'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Toggle Right Panel Button */}
        {!isRightPanelOpen && (
          <Button
            variant="outline"
            size="icon"
            className="fixed right-4 bottom-4 lg:flex hidden"
            onClick={() => setIsRightPanelOpen(true)}
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
