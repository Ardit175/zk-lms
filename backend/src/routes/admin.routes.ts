import { Router } from 'express';
import {
  getStats,
  getEnrollmentChart,
  getTopCourses,
  getUsers,
  updateUser,
  deleteUser,
  getAllCourses,
  getCourseForReview,
  reviewCourse,
} from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/charts/enrollments', getEnrollmentChart);
router.get('/charts/top-courses', getTopCourses);

router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseForReview);
router.post('/courses/:id/review', reviewCourse);

export default router;
