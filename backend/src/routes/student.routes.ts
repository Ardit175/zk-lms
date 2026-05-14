import { Router } from 'express';
import {
  getStudentStats,
  getUpcomingDeadlines,
  getCompetencyData,
  getContinueLearning,
} from '../controllers/student.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAuth, requireRole('STUDENT'), getStudentStats);
router.get('/deadlines', requireAuth, requireRole('STUDENT'), getUpcomingDeadlines);
router.get('/competencies', requireAuth, requireRole('STUDENT'), getCompetencyData);
router.get('/continue-learning', requireAuth, requireRole('STUDENT'), getContinueLearning);

export default router;
