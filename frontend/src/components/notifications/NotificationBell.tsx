'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/auth-store';
import { notificationsApi, type Notification, type NotificationType } from '@/lib/api/notifications';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { sq } from 'date-fns/locale';

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  COURSE_APPROVED: '✅',
  COURSE_REJECTED: '❌',
  ASSIGNMENT_DUE: '📝',
  ASSIGNMENT_GRADED: '📊',
  QUIZ_GRADED: '🎯',
  LIVE_STARTING: '🔴',
  CERTIFICATE_READY: '🏆',
  ENROLLMENT_NEW: '👋',
  SYSTEM_MESSAGE: '📢',
};

export function NotificationBell() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationsApi.getAll(10),
        notificationsApi.getUnreadCount(),
      ]);
      if (notifRes.data) setNotifications(notifRes.data);
      if (countRes.data) setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadNotifications();

      const socket = connectSocket(token);

      socket.on('notification:new', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + 1);
      });

      socket.on('notification:read', ({ notificationId }: { notificationId: string }) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      socket.on('notification:allRead', () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      });

      return () => {
        socket.off('notification:new');
        socket.off('notification:read');
        socket.off('notification:allRead');
        disconnectSocket();
      };
    }
  }, [token, loadNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.relatedEntityType && notification.relatedEntityId) {
      setIsOpen(false);
      navigateToEntity(notification.relatedEntityType, notification.relatedEntityId);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const navigateToEntity = (type: string, id: string) => {
    const role = user?.role.toLowerCase();
    switch (type) {
      case 'course':
        if (role === 'instructor') {
          router.push(`/instructor/courses/${id}/edit`);
        } else if (role === 'student') {
          router.push(`/student/courses/${id}/learn`);
        } else {
          router.push(`/admin/courses/${id}`);
        }
        break;
      case 'enrollment':
        router.push(`/student/courses`);
        break;
      case 'assignment':
        router.push(`/${role}/assignments/${id}`);
        break;
      case 'certificate':
        router.push(`/student/certificates`);
        break;
      case 'liveSession':
        router.push(`/${role}/live/${id}`);
        break;
      default:
        break;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-slate-900">Njoftimet</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-xs h-7"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Sheno te gjitha
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <Bell className="h-8 w-8 mb-2 text-slate-300" />
              <p className="text-sm">Asnje njoftim</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3',
                    !notification.isRead && 'bg-indigo-50/50'
                  )}
                >
                  <span className="text-xl flex-shrink-0">
                    {NOTIFICATION_ICONS[notification.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
                      {notification.body}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: sq,
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => {
              setIsOpen(false);
              const role = user?.role.toLowerCase();
              router.push(`/${role}/notifications`);
            }}
          >
            Shiko te gjitha
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
