import { Router } from 'express';
import {
  getQuiz,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  createQuiz,
  getQuizForEdit,
  deleteQuiz,
} from '../controllers/quiz.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitQuizSchema } from '../validators/quiz.validator';
import { createQuizSchema } from '../validators/quiz-create.validator';

const router = Router();

// ─── INSTRUCTOR ROUTES ───────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(createQuizSchema),
  createQuiz
);

router.get(
  '/lesson/:lessonId',
  requireAuth,
  requireRole('INSTRUCTOR'),
  getQuizForEdit
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('INSTRUCTOR'),
  deleteQuiz
);

// ─── STUDENT ROUTES ──────────────────────────────────────────────────────────

router.get(
  '/:id',
  requireAuth,
  requireRole('STUDENT'),
  getQuiz
);

router.post(
  '/:id/attempts',
  requireAuth,
  requireRole('STUDENT'),
  startAttempt
);

router.post(
  '/attempts/:attemptId/submit',
  requireAuth,
  requireRole('STUDENT'),
  validate(submitQuizSchema),
  submitAttempt
);

router.get(
  '/:id/my-attempts',
  requireAuth,
  requireRole('STUDENT'),
  getMyAttempts
);

export default router;
