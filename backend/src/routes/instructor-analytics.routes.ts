import { Router } from 'express';
import { getCourseAnalytics } from '../controllers/instructor-analytics.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/courses/:id/analytics',
  requireAuth,
  requireRole('INSTRUCTOR'),
  getCourseAnalytics
);

export default router;
