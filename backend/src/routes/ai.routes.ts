import { Router } from 'express';
import { generateQuiz, summarizeContent } from '../controllers/ai.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post(
  '/quiz-generator/generate',
  requireAuth,
  requireRole('INSTRUCTOR'),
  generateQuiz
);

router.post(
  '/content-summarizer/summarize',
  requireAuth,
  requireRole('INSTRUCTOR'),
  summarizeContent
);

export default router;
