import { api, ApiResponse } from '@/lib/api';

export interface AdminStats {
  users: {
    total: number;
    admins: number;
    instructors: number;
    students: number;
  };
  courses: {
    total: number;
    draft: number;
    pendingReview: number;
    published: number;
    archived: number;
  };
  enrollments: {
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
  };
  pendingReviewCourses: Array<{
    id: string;
    title: string;
    slug: string;
    updatedAt: string;
    instructor: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface TopCourse {
  id: string;
  title: string;
  enrollmentCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    coursesCreated: number;
    enrollments: number;
  };
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  enrollmentCount: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
}

export interface CourseForReview {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnailUrl: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: string;
  price: number;
  totalDuration: number;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    instructorProfile: {
      bio: string | null;
      expertise: string[];
    } | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  modules: Array<{
    id: string;
    title: string;
    orderIndex: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      duration: number | null;
      isPublished: boolean;
    }>;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<AdminStats>>('/api/admin/stats');
    return response.data;
  },

  getEnrollmentChart: async () => {
    const response = await api.get<ApiResponse<ChartDataPoint[]>>('/api/admin/charts/enrollments');
    return response.data;
  },

  getTopCourses: async () => {
    const response = await api.get<ApiResponse<TopCourse[]>>('/api/admin/charts/top-courses');
    return response.data;
  },

  getUsers: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const response = await api.get<ApiResponse<{ users: AdminUser[]; pagination: PaginatedResponse<AdminUser>['pagination'] }>>(
      `/api/admin/users?${searchParams.toString()}`
    );
    return response.data;
  },

  updateUser: async (userId: string, data: { role?: string; isActive?: boolean }) => {
    const response = await api.patch<ApiResponse<AdminUser>>(`/api/admin/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/admin/users/${userId}`);
    return response.data;
  },

  getCourses: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const response = await api.get<ApiResponse<{ courses: AdminCourse[]; pagination: PaginatedResponse<AdminCourse>['pagination'] }>>(
      `/api/admin/courses?${searchParams.toString()}`
    );
    return response.data;
  },

  getCourseForReview: async (courseId: string) => {
    const response = await api.get<ApiResponse<CourseForReview>>(`/api/admin/courses/${courseId}`);
    return response.data;
  },

  reviewCourse: async (courseId: string, data: { action: 'approve' | 'reject'; feedback?: string }) => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/api/admin/courses/${courseId}/review`, data);
    return response.data;
  },
};
