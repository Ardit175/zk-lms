import { Router } from 'express';
import {
  submitAssignment,
  getMySubmission,
  getAssignmentSubmissions,
  gradeSubmission,
  getCourseAssignments,
  getAssignmentByLesson,
} from '../controllers/assignment.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitAssignmentSchema, gradeSubmissionSchema } from '../validators/assignment.validator';

const router = Router();

// Student endpoints
router.post(
  '/:id/submit',
  requireAuth,
  requireRole('STUDENT'),
  validate(submitAssignmentSchema),
  submitAssignment
);

router.get(
  '/:id/my-submission',
  requireAuth,
  requireRole('STUDENT'),
  getMySubmission
);

router.get(
  '/lesson/:lessonId',
  requireAuth,
  requireRole('STUDENT'),
  getAssignmentByLesson
);

// Instructor endpoints
router.get(
  '/course/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR'),
  getCourseAssignments
);

router.get(
  '/:id/submissions',
  requireAuth,
  requireRole('INSTRUCTOR'),
  getAssignmentSubmissions
);

router.patch(
  '/submissions/:id/grade',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(gradeSubmissionSchema),
  gradeSubmission
);

export default router;
