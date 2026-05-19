import { prisma } from './prisma';

export async function calculateProgress(
  enrollmentId: string,
  courseId: string
): Promise<number> {
  // Progress = completed lessons / TOTAL lessons in the course.
  // The previous version divided by `lessonProgress.length`, which only counts
  // lessons the student has interacted with — meaning the first completion
  // always yielded 100% and prematurely marked the course as completed.
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({
      where: { module: { courseId } },
    }),
    prisma.lessonProgress.count({
      where: { enrollmentId, isCompleted: true },
    }),
  ]);

  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

export async function checkAndCompleteEnrollment(
  enrollmentId: string,
  studentId: string,
  courseId: string
): Promise<boolean> {
  const progress = await calculateProgress(enrollmentId, courseId);

  if (progress === 100) {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPercent: 100,
      },
    });

    // Generate certificate
    const { generateCertificate } = await import('./certificate.service');
    await generateCertificate(enrollmentId, studentId, courseId);

    return true;
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { progressPercent: progress },
  });

  return false;
}

export async function getDetailedProgress(enrollmentId: string, courseId: string) {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { orderIndex: 'asc' },
    include: {
      lessons: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
          orderIndex: true,
          content: true,
          videoUrl: true,
          videoType: true,
          pdfUrl: true,
          quiz: {
            select: { id: true },
          },
        },
      },
    },
  });

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { enrollmentId },
  });

  type LessonProgressRow = {
    lessonId: string;
    isCompleted: boolean;
    completedAt: Date | null;
    watchedSeconds: number;
  };
  type LessonRow = {
    id: string;
    title: string;
    type: string;
    duration: number | null;
    orderIndex: number;
    content: string | null;
    videoUrl: string | null;
    videoType: string | null;
    pdfUrl: string | null;
    quiz: { id: string } | null;
  };
  type ModuleRow = {
    id: string;
    title: string;
    orderIndex: number;
    lessons: LessonRow[];
  };
  const progressMap = new Map(
    lessonProgress.map((lp: LessonProgressRow) => [lp.lessonId, lp] as const)
  );

  const modulesWithProgress = modules.map((module: ModuleRow) => {
    const lessonsWithProgress = module.lessons.map((lesson: LessonRow) => {
      const progress = progressMap.get(lesson.id);
      return {
        ...lesson,
        quizId: lesson.quiz?.id || null,
        isCompleted: progress?.isCompleted || false,
        completedAt: progress?.completedAt || null,
        watchedSeconds: progress?.watchedSeconds || 0,
      };
    });

    const completedLessons = lessonsWithProgress.filter((l: { isCompleted: boolean }) => l.isCompleted).length;
    const moduleProgress = module.lessons.length > 0
      ? Math.round((completedLessons / module.lessons.length) * 100)
      : 0;

    return {
      id: module.id,
      title: module.title,
      orderIndex: module.orderIndex,
      progressPercent: moduleProgress,
      completedLessons,
      totalLessons: module.lessons.length,
      lessons: lessonsWithProgress,
    };
  });

  const totalLessons = modules.reduce((sum: number, m: ModuleRow) => sum + m.lessons.length, 0);
  const completedLessons = lessonProgress.filter((lp: LessonProgressRow) => lp.isCompleted).length;
  const overallProgress = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return {
    overallProgress,
    completedLessons,
    totalLessons,
    modules: modulesWithProgress,
  };
}
