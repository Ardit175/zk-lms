import { prisma } from './prisma';

export async function calculateProgress(
  enrollmentId: string,
  courseId: string
): Promise<number> {
  // Progress = completed lessons / TOTAL lessons in the course.
  // The previous version divided by `lessonProgress.length`, which only counts
  // lessons the student has interacted with — meaning the first completion
  // always yielded 100% and prematurely marked the course as completed.
  // Only published lessons in published modules count toward completion —
  // otherwise an instructor's draft lesson would make the course impossible to
  // finish (and the certificate unreachable) for already-enrolled students.
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({
      where: { isPublished: true, module: { courseId, isPublished: true } },
    }),
    prisma.lessonProgress.count({
      where: {
        enrollmentId,
        isCompleted: true,
        lesson: { isPublished: true, module: { isPublished: true } },
      },
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
    where: { courseId, isPublished: true },
    orderBy: { orderIndex: 'asc' },
    include: {
      lessons: {
        where: { isPublished: true },
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

  // Derive totals from the published modules/lessons we actually fetched so the
  // percentage stays consistent with calculateProgress (no counting of progress
  // rows that belong to now-unpublished lessons).
  const totalLessons = modulesWithProgress.reduce((sum, m) => sum + m.totalLessons, 0);
  const completedLessons = modulesWithProgress.reduce((sum, m) => sum + m.completedLessons, 0);
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
