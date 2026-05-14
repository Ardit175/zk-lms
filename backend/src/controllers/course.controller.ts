import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { generateSlug, updateCourseDuration, verifyOwnership, canChangeStatus } from '../services/course.service';
import {
  CreateCourseInput,
  UpdateCourseInput,
  CreateModuleInput,
  UpdateModuleInput,
  CreateLessonInput,
  UpdateLessonInput,
} from '../validators/course.validator';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

export const getPublicStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [courseCount, studentCount, instructorCount] = await Promise.all([
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', isActive: true } }),
    ]);

    res.json(ApiResponse.success({
      courses: courseCount,
      students: studentCount,
      instructors: instructorCount,
    }));
  } catch (error) {
    console.error('GetPublicStats error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch stats'));
  }
};

export const getFeaturedCourses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { enrollmentCount: 'desc' },
      take: 3,
    });

    res.json(ApiResponse.success(courses));
  } catch (error) {
    console.error('GetFeaturedCourses error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch featured courses'));
  }
};

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, level, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
    };

    if (category) {
      where.category = { slug: category as string };
    }
    if (level) {
      where.level = level;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { modules: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
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
    console.error('GetCourses error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch courses'));
  }
};

export const getCourseBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = getParam(req.params.slug);

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        category: { select: { id: true, name: true, slug: true } },
        modules: {
          where: { isPublished: true },
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
                isPreview: true,
              },
            },
          },
        },
      },
    });

    if (!course || course.status !== 'PUBLISHED') {
      res.status(404).json(ApiResponse.error('Course not found'));
      return;
    }

    res.json(ApiResponse.success(course));
  } catch (error) {
    console.error('GetCourseBySlug error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch course'));
  }
};

// ─── INSTRUCTOR ROUTES ───────────────────────────────────────────────────────

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, categoryId, level, price } = req.body as CreateCourseInput;
    const instructorId = req.user!.id;

    const slug = generateSlug(title);

    const course = await prisma.course.create({
      data: {
        title,
        description,
        slug,
        level,
        price,
        instructorId,
        categoryId: categoryId || null,
      },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true },
        },
        category: true,
      },
    });

    res.status(201).json(ApiResponse.success(course));
  } catch (error) {
    console.error('CreateCourse error:', error);
    res.status(500).json(ApiResponse.error('Failed to create course'));
  }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const data = req.body as UpdateCourseInput;
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(id, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized to update this course'));
      return;
    }

    const course = await prisma.course.update({
      where: { id },
      data,
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });

    res.json(ApiResponse.success(course));
  } catch (error) {
    console.error('UpdateCourse error:', error);
    res.status(500).json(ApiResponse.error('Failed to update course'));
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(id, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized to delete this course'));
      return;
    }

    await prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    res.json(ApiResponse.success({ message: 'Course archived successfully' }));
  } catch (error) {
    console.error('DeleteCourse error:', error);
    res.status(500).json(ApiResponse.error('Failed to archive course'));
  }
};

export const updateCourseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const { status: newStatus } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const course = await prisma.course.findUnique({
      where: { id },
      select: { instructorId: true, status: true },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Course not found'));
      return;
    }

    if (userRole !== 'ADMIN' && course.instructorId !== userId) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    const allowed = await canChangeStatus(course.status, newStatus, userRole);
    if (!allowed) {
      res.status(400).json(ApiResponse.error(`Cannot change status from ${course.status} to ${newStatus}`));
      return;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { status: newStatus },
    });

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('UpdateCourseStatus error:', error);
    res.status(500).json(ApiResponse.error('Failed to update status'));
  }
};

export const getInstructorCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;

    const courses = await prisma.course.findMany({
      where: { instructorId },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(ApiResponse.success(courses));
  } catch (error) {
    console.error('GetInstructorCourses error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch courses'));
  }
};

// ─── MODULE ROUTES ───────────────────────────────────────────────────────────

export const getModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.json(ApiResponse.success(modules));
  } catch (error) {
    console.error('GetModules error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch modules'));
  }
};

export const createModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const { title, description } = req.body as CreateModuleInput;
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    const maxOrder = await prisma.module.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });

    const module = await prisma.module.create({
      data: {
        title,
        description,
        courseId,
        orderIndex: (maxOrder._max?.orderIndex ?? -1) + 1,
      },
    });

    res.status(201).json(ApiResponse.success(module));
  } catch (error) {
    console.error('CreateModule error:', error);
    res.status(500).json(ApiResponse.error('Failed to create module'));
  }
};

export const updateModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const moduleId = getParam(req.params.moduleId);
    const data = req.body as UpdateModuleInput;
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    const module = await prisma.module.update({
      where: { id: moduleId, courseId },
      data,
    });

    res.json(ApiResponse.success(module));
  } catch (error) {
    console.error('UpdateModule error:', error);
    res.status(500).json(ApiResponse.error('Failed to update module'));
  }
};

export const deleteModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const moduleId = getParam(req.params.moduleId);
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    await prisma.module.delete({
      where: { id: moduleId, courseId },
    });

    await updateCourseDuration(courseId);

    res.json(ApiResponse.success({ message: 'Module deleted successfully' }));
  } catch (error) {
    console.error('DeleteModule error:', error);
    res.status(500).json(ApiResponse.error('Failed to delete module'));
  }
};

export const reorderModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const { modules } = req.body as { modules: { id: string; orderIndex: number }[] };
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    await prisma.$transaction(
      modules.map(({ id, orderIndex }) =>
        prisma.module.update({
          where: { id, courseId },
          data: { orderIndex },
        })
      )
    );

    res.json(ApiResponse.success({ message: 'Modules reordered successfully' }));
  } catch (error) {
    console.error('ReorderModules error:', error);
    res.status(500).json(ApiResponse.error('Failed to reorder modules'));
  }
};

// ─── LESSON ROUTES ───────────────────────────────────────────────────────────

export const createLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const moduleId = getParam(req.params.moduleId);
    const { title, content, videoUrl, duration, type, isPreview } = req.body as CreateLessonInput;
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    const maxOrder = await prisma.lesson.aggregate({
      where: { moduleId },
      _max: { orderIndex: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        duration,
        type,
        isPreview,
        moduleId,
        orderIndex: (maxOrder._max?.orderIndex ?? -1) + 1,
      },
    });

    await updateCourseDuration(courseId);

    res.status(201).json(ApiResponse.success(lesson));
  } catch (error) {
    console.error('CreateLesson error:', error);
    res.status(500).json(ApiResponse.error('Failed to create lesson'));
  }
};

export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const moduleId = getParam(req.params.moduleId);
    const lessonId = getParam(req.params.lessonId);
    const data = req.body as UpdateLessonInput;
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId, moduleId },
      data,
    });

    await updateCourseDuration(courseId);

    res.json(ApiResponse.success(lesson));
  } catch (error) {
    console.error('UpdateLesson error:', error);
    res.status(500).json(ApiResponse.error('Failed to update lesson'));
  }
};

export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const moduleId = getParam(req.params.moduleId);
    const lessonId = getParam(req.params.lessonId);
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    await prisma.lesson.delete({
      where: { id: lessonId, moduleId },
    });

    await updateCourseDuration(courseId);

    res.json(ApiResponse.success({ message: 'Lesson deleted successfully' }));
  } catch (error) {
    console.error('DeleteLesson error:', error);
    res.status(500).json(ApiResponse.error('Failed to delete lesson'));
  }
};

export const reorderLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = getParam(req.params.id);
    const moduleId = getParam(req.params.moduleId);
    const { lessons } = req.body as { lessons: { id: string; orderIndex: number }[] };
    const userId = req.user!.id;

    const isOwner = await verifyOwnership(courseId, userId);
    if (!isOwner) {
      res.status(403).json(ApiResponse.error('Not authorized'));
      return;
    }

    await prisma.$transaction(
      lessons.map(({ id, orderIndex }) =>
        prisma.lesson.update({
          where: { id, moduleId },
          data: { orderIndex },
        })
      )
    );

    res.json(ApiResponse.success({ message: 'Lessons reordered successfully' }));
  } catch (error) {
    console.error('ReorderLessons error:', error);
    res.status(500).json(ApiResponse.error('Failed to reorder lessons'));
  }
};
