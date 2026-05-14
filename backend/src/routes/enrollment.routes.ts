import { Router } from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  getCourseProgress,
  markLessonComplete,
} from '../controllers/enrollment.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  enrollInCourseSchema,
  markLessonCompleteSchema,
} from '../validators/enrollment.validator';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('STUDENT'),
  validate(enrollInCourseSchema),
  enrollInCourse
);

router.get(
  '/my-courses',
  requireAuth,
  requireRole('STUDENT'),
  getMyEnrollments
);

router.get(
  '/:courseId/progress',
  requireAuth,
  requireRole('STUDENT'),
  getCourseProgress
);

router.patch(
  '/:courseId/lessons/:lessonId/complete',
  requireAuth,
  requireRole('STUDENT'),
  validate(markLessonCompleteSchema),
  markLessonComplete
);

export default router;
