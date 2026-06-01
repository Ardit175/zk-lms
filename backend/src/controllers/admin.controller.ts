import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { notificationService } from '../services/notification.service';
import { cacheGet, cacheSet, cacheKeys, TTL } from '../lib/cache';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const cached = await cacheGet(cacheKeys.adminStats);
    if (cached) {
      res.json(ApiResponse.success(cached));
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      userCounts,
      courseCounts,
      enrollmentsThisMonth,
      enrollmentsLastMonth,
      pendingReviewCourses,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: { isActive: true },
      }),
      prisma.course.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.enrollment.count({
        where: { enrolledAt: { gte: startOfMonth } },
      }),
      prisma.enrollment.count({
        where: {
          enrolledAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prisma.course.findMany({
        where: { status: 'PENDING_REVIEW' },
        orderBy: { updatedAt: 'asc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          instructor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const users = {
      total: userCounts.reduce((sum: number, u: { role: string; _count: number }) => sum + u._count, 0),
      admins: userCounts.find((u: { role: string; _count: number }) => u.role === 'ADMIN')?._count || 0,
      instructors: userCounts.find((u: { role: string; _count: number }) => u.role === 'INSTRUCTOR')?._count || 0,
      students: userCounts.find((u: { role: string; _count: number }) => u.role === 'STUDENT')?._count || 0,
    };

    const courses = {
      total: courseCounts.reduce((sum: number, c: { status: string; _count: number }) => sum + c._count, 0),
      draft: courseCounts.find((c: { status: string; _count: number }) => c.status === 'DRAFT')?._count || 0,
      pendingReview: courseCounts.find((c: { status: string; _count: number }) => c.status === 'PENDING_REVIEW')?._count || 0,
      published: courseCounts.find((c: { status: string; _count: number }) => c.status === 'PUBLISHED')?._count || 0,
      archived: courseCounts.find((c: { status: string; _count: number }) => c.status === 'ARCHIVED')?._count || 0,
    };

    const enrollmentChange = enrollmentsLastMonth > 0
      ? Math.round(((enrollmentsThisMonth - enrollmentsLastMonth) / enrollmentsLastMonth) * 100)
      : 100;

    const payload = {
      users,
      courses,
      enrollments: {
        thisMonth: enrollmentsThisMonth,
        lastMonth: enrollmentsLastMonth,
        changePercent: enrollmentChange,
      },
      pendingReviewCourses,
    };

    await cacheSet(cacheKeys.adminStats, payload, TTL.ADMIN_STATS);
    res.json(ApiResponse.success(payload));
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte statistikat'));
  }
};

export const getEnrollmentChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const enrollments = await prisma.enrollment.findMany({
      where: { enrolledAt: { gte: startDate } },
      select: { enrolledAt: true },
    });

    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }

    enrollments.forEach((e: { enrolledAt: Date }) => {
      const key = e.enrolledAt.toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) {
        dailyCounts[key]++;
      }
    });

    const chartData = Object.entries(dailyCounts)
      .map(([date, count]: [string, number]) => ({ date, count }))
      .sort((a: { date: string; count: number }, b: { date: string; count: number }) => a.date.localeCompare(b.date));

    res.json(ApiResponse.success(chartData));
  } catch (error) {
    console.error('GetEnrollmentChart error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte te dhenat e grafikut'));
  }
};

export const getTopCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const topCourses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { enrollmentCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        enrollmentCount: true,
      },
    });

    res.json(ApiResponse.success(topCourses));
  } catch (error) {
    console.error('GetTopCourses error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kurset kryesore'));
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      role,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role && ['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(role as string)) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              coursesCreated: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(ApiResponse.success({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte perdoruesit'));
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id as string;
    const { role, isActive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json(ApiResponse.error('Perdoruesi nuk u gjet'));
      return;
    }

    if (user.id === req.user!.id) {
      if (isActive === false) {
        res.status(400).json(ApiResponse.error('Nuk mund te deaktivizosh veten'));
        return;
      }
      if (role && role !== 'ADMIN') {
        res.status(400).json(ApiResponse.error('Nuk mund te ndryshosh rolin tend'));
        return;
      }
    }

    // Prevent removing the last active admin.
    if (role && role !== 'ADMIN' && user.role === 'ADMIN') {
      const remainingAdmins = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true, id: { not: userId } },
      });
      if (remainingAdmins === 0) {
        res.status(400).json(ApiResponse.error('Duhet te mbetet te pakten nje admin aktiv'));
        return;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (role && ['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(role)) {
      updateData.role = role;
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json(ApiResponse.success(updatedUser));
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te perditesonte perdoruesin'));
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id as string;

    if (userId === req.user!.id) {
      res.status(400).json(ApiResponse.error('Nuk mund te fshish veten'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json(ApiResponse.error('Perdoruesi nuk u gjet'));
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    res.json(ApiResponse.success({ message: 'Perdoruesi u deaktivizua' }));
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te fshinte perdoruesin'));
  }
};

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};

    if (status && ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'].includes(status as string)) {
      where.status = status;
    }

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          level: true,
          enrollmentCount: true,
          averageRating: true,
          createdAt: true,
          updatedAt: true,
          instructor: {
            select: { id: true, firstName: true, lastName: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json(ApiResponse.success({
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    console.error('GetAllCourses error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kurset'));
  }
};

export const getCourseForReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id as string;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            instructorProfile: true,
          },
        },
        category: true,
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isPublished: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Kursi nuk u gjet'));
      return;
    }

    res.json(ApiResponse.success(course));
  } catch (error) {
    console.error('GetCourseForReview error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kursin'));
  }
};

export const reviewCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id as string;
    const { action, feedback } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, instructorId: true, status: true },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Kursi nuk u gjet'));
      return;
    }

    if (course.status !== 'PENDING_REVIEW') {
      res.status(400).json(ApiResponse.error('Ky kurs nuk eshte ne pritje per rishikim'));
      return;
    }

    if (action === 'approve') {
      await prisma.course.update({
        where: { id: courseId },
        data: { status: 'PUBLISHED' },
      });

      await notificationService.notifyCourseApproved(
        course.instructorId,
        courseId,
        course.title
      );

      res.json(ApiResponse.success({ message: 'Kursi u aprovua me sukses' }));
    } else if (action === 'reject') {
      if (!feedback) {
        res.status(400).json(ApiResponse.error('Feedback eshte i detyrueshem per refuzim'));
        return;
      }

      await prisma.course.update({
        where: { id: courseId },
        data: { status: 'DRAFT' },
      });

      await notificationService.notifyCourseRejected(
        course.instructorId,
        courseId,
        course.title,
        feedback
      );

      res.json(ApiResponse.success({ message: 'Kerkesa per ndryshime u dergua' }));
    } else {
      res.status(400).json(ApiResponse.error('Veprim i pavlefshem'));
    }
  } catch (error) {
    console.error('ReviewCourse error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te procesonte rishikimin'));
  }
};
