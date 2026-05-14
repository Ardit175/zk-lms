'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { notificationsApi, type Notification, type NotificationType } from '@/lib/api/notifications';
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

export function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.getAll(50);
      if (res.data) setNotifications(res.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.relatedEntityType && notification.relatedEntityId) {
      navigateToEntity(notification.relatedEntityType, notification.relatedEntityId);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Njoftimet</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} njofitme te palexuara`
              : 'Te gjitha njoftimet jane lexuar'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Sheno te gjitha si te lexuara
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Bell className="h-12 w-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium">Asnje njoftim</p>
            <p className="text-sm mt-1">Do te shfaqen ketu njoftimet e reja</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'cursor-pointer hover:bg-slate-50 transition-colors',
                !notification.isRead && 'bg-indigo-50/50 border-indigo-200'
              )}
              onClick={() => handleMarkAsRead(notification)}
            >
              <CardContent className="p-4 flex gap-4">
                <span className="text-2xl flex-shrink-0">
                  {NOTIFICATION_ICONS[notification.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notification.body}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: sq,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
