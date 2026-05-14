import { Router } from 'express';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import categoryRoutes from './category.routes';
import enrollmentRoutes from './enrollment.routes';
import quizRoutes from './quiz.routes';
import adminRoutes from './admin.routes';
import aiRoutes from './ai.routes';
import notificationRoutes from './notification.routes';
import liveSessionRoutes from './live-session.routes';
import instructorAnalyticsRoutes from './instructor-analytics.routes';
import certificateRoutes from './certificate.routes';
import assignmentRoutes from './assignment.routes';
import uploadRoutes from './upload.routes';
import studentRoutes from './student.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/categories', categoryRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/quizzes', quizRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/live-sessions', liveSessionRoutes);
router.use('/instructor', instructorAnalyticsRoutes);
router.use('/certificates', certificateRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/student', studentRoutes);

export default router;
