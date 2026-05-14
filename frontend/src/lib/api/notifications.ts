import { api, ApiResponse } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'COURSE_APPROVED'
  | 'COURSE_REJECTED'
  | 'ASSIGNMENT_DUE'
  | 'ASSIGNMENT_GRADED'
  | 'QUIZ_GRADED'
  | 'LIVE_STARTING'
  | 'CERTIFICATE_READY'
  | 'ENROLLMENT_NEW'
  | 'SYSTEM_MESSAGE';

export const notificationsApi = {
  getAll: async (limit = 20) => {
    const response = await api.get<ApiResponse<Notification[]>>(`/api/notifications?limit=${limit}`);
    return response.data;
  },

  getUnread: async () => {
    const response = await api.get<ApiResponse<Notification[]>>('/api/notifications/unread');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<ApiResponse<{ count: number }>>('/api/notifications/unread/count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch<ApiResponse<Notification>>(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch<ApiResponse<{ message: string }>>('/api/notifications/read-all');
    return response.data;
  },
};
