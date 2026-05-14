import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';

export const getCourseAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id as string;
    const instructorId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, title: true },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Kursi nuk u gjet'));
      return;
    }

    if (course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete kurs'));
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Overview stats
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: {
        id: true,
        progressPercent: true,
        status: true,
        enrolledAt: true,
      },
    });

    const totalStudents = enrollments.length;
    const completedStudents = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

    // Average quiz score
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          lesson: {
            module: { courseId },
          },
        },
        completedAt: { not: null },
      },
      select: { score: true },
    });

    const averageScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.length)
      : 0;

    // Average rating (placeholder - would come from a reviews table)
    const averageRating = 4.5;

    // Enrollments over time
    const enrollmentsByDate = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      enrollmentsByDate.set(dateStr, 0);
    }

    enrollments
      .filter((e) => new Date(e.enrolledAt) >= startDate)
      .forEach((e) => {
        const dateStr = new Date(e.enrolledAt).toISOString().split('T')[0];
        if (enrollmentsByDate.has(dateStr)) {
          enrollmentsByDate.set(dateStr, (enrollmentsByDate.get(dateStr) || 0) + 1);
        }
      });

    const enrollmentOverTime = Array.from(enrollmentsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Progress distribution
    const progressBuckets = [
      { range: '0-25%', min: 0, max: 25, count: 0 },
      { range: '26-50%', min: 26, max: 50, count: 0 },
      { range: '51-75%', min: 51, max: 75, count: 0 },
      { range: '76-100%', min: 76, max: 100, count: 0 },
    ];

    enrollments.forEach((e) => {
      const progress = e.progressPercent;
      const bucket = progressBuckets.find((b) => progress >= b.min && progress <= b.max);
      if (bucket) bucket.count++;
    });

    const progressDistribution = progressBuckets.map(({ range, count }) => ({ range, count }));

    // Module completion
    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          select: {
            id: true,
            duration: true,
            lessonProgress: {
              select: { isCompleted: true },
            },
          },
        },
      },
    });

    const moduleCompletion = modules.map((module) => {
      const totalLessons = module.lessons.length;
      const totalProgress = module.lessons.reduce((sum, lesson) => {
        const completed = lesson.lessonProgress.filter((lp) => lp.isCompleted).length;
        const total = lesson.lessonProgress.length;
        return sum + (total > 0 ? completed / total : 0);
      }, 0);

      const completionRate = totalLessons > 0 ? Math.round((totalProgress / totalLessons) * 100) : 0;
      const avgTimeMinutes = Math.round(
        module.lessons.reduce((sum, l) => sum + (l.duration || 0), 0) / 60
      );

      return {
        moduleTitle: module.title,
        lessonsCount: totalLessons,
        completionRate,
        avgTimeMinutes,
      };
    });

    // Hardest questions
    const questions = await prisma.quizQuestion.findMany({
      where: {
        quiz: {
          lesson: {
            module: { courseId },
          },
        },
      },
      include: {
        quiz: { select: { title: true } },
        answers: { select: { isCorrect: true } },
      },
    });

    const hardestQuestions = questions
      .map((q) => {
        const totalAnswers = q.answers.length;
        const wrongAnswers = q.answers.filter((a) => !a.isCorrect).length;
        const wrongAnswerRate = totalAnswers > 0 ? Math.round((wrongAnswers / totalAnswers) * 100) : 0;

        return {
          questionText: q.questionText,
          quizTitle: q.quiz.title,
          wrongAnswerRate,
          totalAnswers,
        };
      })
      .filter((q) => q.totalAnswers >= 3)
      .sort((a, b) => b.wrongAnswerRate - a.wrongAnswerRate)
      .slice(0, 5);

    // Recent activity
    const recentLessonProgress = await prisma.lessonProgress.findMany({
      where: {
        lesson: {
          module: { courseId },
        },
        isCompleted: true,
        completedAt: { gte: startDate },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true } },
          },
        },
        lesson: { select: { title: true } },
      },
    });

    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        enrolledAt: { gte: startDate },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 10,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    const recentActivity = [
      ...recentLessonProgress.map((lp) => ({
        studentName: `${lp.enrollment.student.firstName} ${lp.enrollment.student.lastName}`,
        action: `perfundoi mesimin "${lp.lesson.title}"`,
        timestamp: lp.completedAt!.toISOString(),
        type: 'lesson_completed' as const,
      })),
      ...recentEnrollments.map((e) => ({
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        action: 'u regjistrua ne kurs',
        timestamp: e.enrolledAt.toISOString(),
        type: 'enrollment' as const,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    res.json(ApiResponse.success({
      overview: {
        totalStudents,
        completionRate,
        averageScore,
        averageRating,
      },
      enrollmentOverTime,
      progressDistribution,
      moduleCompletion,
      hardestQuestions,
      recentActivity,
    }));
  } catch (error) {
    console.error('GetCourseAnalytics error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte analitiken'));
  }
};
