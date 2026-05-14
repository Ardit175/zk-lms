import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { checkAndCompleteEnrollment, getDetailedProgress } from '../services/enrollment.service';
import { EnrollInCourseInput } from '../validators/enrollment.validator';
import { notificationService } from '../services/notification.service';

async function updateStudentStreak(studentId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
  });

  if (!profile) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (profile.lastStudiedAt) {
    const lastStudied = new Date(profile.lastStudiedAt);
    const lastStudiedDay = new Date(lastStudied.getFullYear(), lastStudied.getMonth(), lastStudied.getDate());

    const diffDays = Math.floor((today.getTime() - lastStudiedDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day - just update lastStudiedAt
      await prisma.studentProfile.update({
        where: { userId: studentId },
        data: { lastStudiedAt: now },
      });
    } else if (diffDays === 1) {
      // Consecutive day - increment streak
      await prisma.studentProfile.update({
        where: { userId: studentId },
        data: {
          streakDays: { increment: 1 },
          lastStudiedAt: now,
        },
      });
    } else {
      // Gap > 1 day - reset streak
      await prisma.studentProfile.update({
        where: { userId: studentId },
        data: {
          streakDays: 1,
          lastStudiedAt: now,
        },
      });
    }
  } else {
    // First time studying
    await prisma.studentProfile.update({
      where: { userId: studentId },
      data: {
        streakDays: 1,
        lastStudiedAt: now,
      },
    });
  }
}

export const enrollInCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.body as EnrollInCourseInput;
    const studentId = req.user!.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, title: true, instructorId: true },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Kursi nuk u gjet'));
      return;
    }

    if (course.status !== 'PUBLISHED') {
      res.status(400).json(ApiResponse.error('Ky kurs nuk eshte i disponueshem per regjistrim'));
      return;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (existingEnrollment) {
      res.status(400).json(ApiResponse.error('Je i regjistruar tashme ne kete kurs'));
      return;
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnailUrl: true },
        },
      },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    });

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    });

    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Nje student';

    await notificationService.notifyNewEnrollment(
      course.instructorId,
      studentName,
      courseId,
      course.title
    );

    res.status(201).json(ApiResponse.success(enrollment));
  } catch (error) {
    console.error('EnrollInCourse error:', error);
    res.status(500).json(ApiResponse.error('Regjistrimi deshtoi'));
  }
};

export const getMyEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { status } = req.query;

    const where: Record<string, unknown> = { studentId };
    if (status && ['ACTIVE', 'COMPLETED', 'DROPPED'].includes(status as string)) {
      where.status = status;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            level: true,
            totalDuration: true,
            instructor: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { modules: true } },
          },
        },
        certificate: {
          select: { id: true, certificateNumber: true, issuedAt: true },
        },
      },
      orderBy: { lastAccessedAt: { sort: 'desc', nulls: 'last' } },
    });

    res.json(ApiResponse.success(enrollments));
  } catch (error) {
    console.error('GetMyEnrollments error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kurset tuaja'));
  }
};

export const getCourseProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const studentId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (!enrollment) {
      res.status(404).json(ApiResponse.error('Nuk je i regjistruar ne kete kurs'));
      return;
    }

    const progress = await getDetailedProgress(enrollment.id, courseId);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastAccessedAt: new Date() },
    });

    res.json(ApiResponse.success({
      enrollmentId: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      ...progress,
    }));
  } catch (error) {
    console.error('GetCourseProgress error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte progresin'));
  }
};

export const markLessonComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const lessonId = req.params.lessonId as string;
    const { watchedSeconds } = req.body;
    const studentId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (!enrollment) {
      res.status(404).json(ApiResponse.error('Nuk je i regjistruar ne kete kurs'));
      return;
    }

    if (enrollment.status === 'COMPLETED') {
      res.status(400).json(ApiResponse.error('Ky kurs eshte perfunduar tashme'));
      return;
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: { courseId },
      },
    });

    if (!lesson) {
      res.status(404).json(ApiResponse.error('Mesimi nuk u gjet ne kete kurs'));
      return;
    }

    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        watchedSeconds: watchedSeconds ?? 0,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
        watchedSeconds: watchedSeconds ?? 0,
      },
    });

    const courseCompleted = await checkAndCompleteEnrollment(
      enrollment.id,
      studentId,
      courseId
    );

    // Update streak
    await updateStudentStreak(studentId);

    res.json(ApiResponse.success({
      lessonProgress,
      courseCompleted,
    }));
  } catch (error) {
    console.error('MarkLessonComplete error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te shenonte mesimin si te perfunduar'));
  }
};
