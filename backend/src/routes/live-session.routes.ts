import { Router } from 'express';
import {
  createSession,
  getMySessions,
  getUpcomingSessions,
  getSession,
  startSession,
  endSession,
  askQuestion,
  upvoteQuestion,
  markAnswered,
} from '../controllers/live-session.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLiveSessionSchema, askQuestionSchema } from '../validators/live-session.validator';

const router = Router();

// Instructor routes
router.post(
  '/',
  requireAuth,
  requireRole('INSTRUCTOR'),
  validate(createLiveSessionSchema),
  createSession
);

router.get(
  '/my-sessions',
  requireAuth,
  requireRole('INSTRUCTOR'),
  getMySessions
);

router.patch(
  '/:id/start',
  requireAuth,
  requireRole('INSTRUCTOR'),
  startSession
);

router.patch(
  '/:id/end',
  requireAuth,
  requireRole('INSTRUCTOR'),
  endSession
);

router.patch(
  '/:id/questions/:qid/answer',
  requireAuth,
  requireRole('INSTRUCTOR'),
  markAnswered
);

// Student routes
router.get(
  '/upcoming',
  requireAuth,
  requireRole('STUDENT'),
  getUpcomingSessions
);

router.post(
  '/:id/questions',
  requireAuth,
  requireRole('STUDENT'),
  validate(askQuestionSchema),
  askQuestion
);

router.patch(
  '/:id/questions/:qid/upvote',
  requireAuth,
  upvoteQuestion
);

// Shared routes (both instructor and student)
router.get(
  '/:id',
  requireAuth,
  getSession
);

export default router;
