import { Router } from 'express';
import {
  getCourses,
  getCourseBySlug,
  getPublicStats,
  getFeaturedCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  getInstructorCourses,
  getModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from '../controllers/course.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createCourseSchema,
  updateCourseSchema,
  updateCourseStatusSchema,
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
} from '../validators/course.validator';

const router = Router();

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────
router.get('/stats', getPublicStats);
router.get('/featured', getFeaturedCourses);
router.get('/', getCourses);
router.get('/slug/:slug', getCourseBySlug);

// ─── INSTRUCTOR ROUTES ───────────────────────────────────────────────────────
router.get('/my-courses', requireAuth, requireRole('INSTRUCTOR'), getInstructorCourses);

router.post(
  '/',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(createCourseSchema),
  createCourse
);

router.put(
  '/:id',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(updateCourseSchema),
  updateCourse
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('INSTRUCTOR'),
  deleteCourse
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  validate(updateCourseStatusSchema),
  updateCourseStatus
);

// ─── MODULE ROUTES ───────────────────────────────────────────────────────────
router.get('/:id/modules', requireAuth, getModules);

router.post(
  '/:id/modules',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(createModuleSchema),
  createModule
);

router.put(
  '/:id/modules/:moduleId',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(updateModuleSchema),
  updateModule
);

router.delete(
  '/:id/modules/:moduleId',
  requireAuth,
  requireRole('INSTRUCTOR'),
  deleteModule
);

router.patch(
  '/:id/modules/reorder',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(reorderModulesSchema),
  reorderModules
);

// ─── LESSON ROUTES ───────────────────────────────────────────────────────────
router.post(
  '/:id/modules/:moduleId/lessons',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(createLessonSchema),
  createLesson
);

router.put(
  '/:id/modules/:moduleId/lessons/:lessonId',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(updateLessonSchema),
  updateLesson
);

router.delete(
  '/:id/modules/:moduleId/lessons/:lessonId',
  requireAuth,
  requireRole('INSTRUCTOR'),
  deleteLesson
);

router.patch(
  '/:id/modules/:moduleId/lessons/reorder',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(reorderLessonsSchema),
  reorderLessons
);

export default router;
