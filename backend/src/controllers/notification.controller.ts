import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { notificationService } from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await notificationService.getAll(userId, limit);

    res.json(ApiResponse.success(notifications));
  } catch (error) {
    console.error('GetNotifications error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte njoftimet'));
  }
};

export const getUnreadNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const notifications = await notificationService.getUnread(userId);

    res.json(ApiResponse.success(notifications));
  } catch (error) {
    console.error('GetUnreadNotifications error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte njoftimet'));
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await notificationService.getUnreadCount(userId);

    res.json(ApiResponse.success({ count }));
  } catch (error) {
    console.error('GetUnreadCount error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte numrin e njoftime'));
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id as string;

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      res.status(404).json(ApiResponse.error('Njoftime nuk u gjet'));
      return;
    }

    res.json(ApiResponse.success(notification));
  } catch (error) {
    console.error('MarkAsRead error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te shenonte si te lexuar'));
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await notificationService.markAllAsRead(userId);

    res.json(ApiResponse.success({ message: 'Te gjitha njoftimet u shenuan si te lexuara' }));
  } catch (error) {
    console.error('MarkAllAsRead error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te shenonte si te lexuara'));
  }
};
