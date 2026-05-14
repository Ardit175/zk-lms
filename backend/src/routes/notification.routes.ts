import { Router } from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getNotifications);

router.get('/unread', requireAuth, getUnreadNotifications);

router.get('/unread/count', requireAuth, getUnreadCount);

router.patch('/:id/read', requireAuth, markAsRead);

router.patch('/read-all', requireAuth, markAllAsRead);

export default router;
