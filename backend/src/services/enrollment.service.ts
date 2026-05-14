import { prisma } from './prisma';

export async function calculateProgress(enrollmentId: string): Promise<number> {
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { enrollmentId },
  });

  if (lessonProgress.length === 0) return 0;

  const completed = lessonProgress.filter((lp) => lp.isCompleted).length;
  return Math.round((completed / lessonProgress.length) * 100);
}

export async function checkAndCompleteEnrollment(
  enrollmentId: string,
  studentId: string,
  courseId: string
): Promise<boolean> {
  const progress = await calculateProgress(enrollmentId);

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

  const progressMap = new Map(lessonProgress.map((lp) => [lp.lessonId, lp]));

  const modulesWithProgress = modules.map((module) => {
    const lessonsWithProgress = module.lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        ...lesson,
        quizId: lesson.quiz?.id || null,
        isCompleted: progress?.isCompleted || false,
        completedAt: progress?.completedAt || null,
        watchedSeconds: progress?.watchedSeconds || 0,
      };
    });

    const completedLessons = lessonsWithProgress.filter((l) => l.isCompleted).length;
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

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = lessonProgress.filter((lp) => lp.isCompleted).length;
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
