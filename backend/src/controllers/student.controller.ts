import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';

export const getStudentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const [
      studentProfile,
      enrollments,
      quizAttempts,
      lessonProgress,
      certificates,
    ] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: studentId },
      }),
      prisma.enrollment.findMany({
        where: { studentId },
        select: { id: true, status: true },
      }),
      prisma.quizAttempt.findMany({
        where: { studentId, completedAt: { not: null } },
        select: { score: true, isPassed: true },
      }),
      prisma.lessonProgress.findMany({
        where: {
          enrollment: { studentId },
          lesson: { type: 'VIDEO' },
        },
        select: { watchedSeconds: true },
      }),
      prisma.certificate.count({
        where: { studentId },
      }),
    ]);

    type LpRow = { watchedSeconds: number };
    type QaRow = { score: number | null; isPassed: boolean | null };
    type EnrRow = { id: string; status: string };
    const totalWatchedSeconds = lessonProgress.reduce((sum: number, lp: LpRow) => sum + lp.watchedSeconds, 0);
    const studyHours = Math.round((totalWatchedSeconds / 3600) * 10) / 10;

    const completedQuizzes = quizAttempts.filter((q: QaRow) => q.isPassed).length;
    const averageQuizScore =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum: number, q: QaRow) => sum + (q.score || 0), 0) / quizAttempts.length)
        : 0;

    res.json(
      ApiResponse.success({
        studyHours,
        coursesEnrolled: enrollments.length,
        coursesCompleted: enrollments.filter((e: EnrRow) => e.status === 'COMPLETED').length,
        quizzesCompleted: completedQuizzes,
        averageQuizScore,
        certificates,
        streakDays: studentProfile?.streakDays || 0,
        lastStudiedAt: studentProfile?.lastStudiedAt,
      })
    );
  } catch (error) {
    console.error('GetStudentStats error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte statistikat'));
  }
};

export const getUpcomingDeadlines = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const enrolledCourseIds = await prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      select: { courseId: true },
    });

    const courseIds = enrolledCourseIds.map((e: { courseId: string }) => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: sevenDaysLater,
        },
        lesson: {
          module: {
            courseId: { in: courseIds },
          },
        },
        submissions: {
          none: { studentId },
        },
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    type AssignmentWithCourse = {
      id: string;
      title: string;
      lessonId: string;
      dueDate: Date | null;
      lesson: { module: { course: { id: string; title: string } } };
    };
    const deadlines = assignments.map((a: AssignmentWithCourse) => ({
      id: a.id,
      type: 'assignment' as const,
      title: a.title,
      courseName: a.lesson.module.course.title,
      courseId: a.lesson.module.course.id,
      lessonId: a.lessonId,
      dueDate: a.dueDate,
    }));

    res.json(ApiResponse.success(deadlines));
  } catch (error) {
    console.error('GetUpcomingDeadlines error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte afatet'));
  }
};

export const getCompetencyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId,
        completedAt: { not: null },
        isPassed: true,
      },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      include: {
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const categoryScores: Record<string, { total: number; count: number }> = {};

    for (const attempt of quizAttempts) {
      const category = attempt.quiz.lesson.module.course.category;
      if (category) {
        if (!categoryScores[category.name]) {
          categoryScores[category.name] = { total: 0, count: 0 };
        }
        categoryScores[category.name].total += attempt.score || 0;
        categoryScores[category.name].count += 1;
      }
    }

    const competencies = Object.entries(categoryScores).map(
      ([category, data]: [string, { total: number; count: number }]) => ({
        category,
        score: Math.round(data.total / data.count),
        quizzesTaken: data.count,
      })
    );

    res.json(ApiResponse.success(competencies));
  } catch (error) {
    console.error('GetCompetencyData error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kompetencat'));
  }
};

export const getContinueLearning = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
      },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        course: {
          include: {
            instructor: {
              select: { firstName: true, lastName: true },
            },
            modules: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' },
                  select: { id: true },
                },
              },
            },
          },
        },
        lessonProgress: {
          where: { isCompleted: false },
          orderBy: {
            lesson: { orderIndex: 'asc' },
          },
          take: 1,
          include: {
            lesson: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!enrollment) {
      res.json(ApiResponse.success(null));
      return;
    }

    let nextLessonId: string | null = null;

    if (enrollment.lessonProgress.length > 0) {
      nextLessonId = enrollment.lessonProgress[0].lessonId;
    } else {
      for (const module of enrollment.course.modules) {
        if (module.lessons.length > 0) {
          nextLessonId = module.lessons[0].id;
          break;
        }
      }
    }

    res.json(
      ApiResponse.success({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        courseThumbnail: enrollment.course.thumbnailUrl,
        instructorName: `${enrollment.course.instructor.firstName} ${enrollment.course.instructor.lastName}`,
        progressPercent: enrollment.progressPercent,
        nextLessonId,
        lastAccessedAt: enrollment.lastAccessedAt,
      })
    );
  } catch (error) {
    console.error('GetContinueLearning error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kursin'));
  }
};
