import { api, ApiResponse } from '@/lib/api';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  progressPercent: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    totalDuration: number;
    instructor: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    _count: {
      modules: number;
    };
  };
  certificate: {
    id: string;
    certificateNumber: string;
    issuedAt: string;
  } | null;
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  isCompleted: boolean;
  watchedSeconds: number;
  completedAt: string | null;
}

export interface ModuleProgress {
  id: string;
  title: string;
  orderIndex: number;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lessons: Array<{
    id: string;
    title: string;
    type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
    duration: number | null;
    orderIndex: number;
    isCompleted: boolean;
    completedAt: string | null;
    watchedSeconds: number;
    content?: string;
    videoUrl?: string;
    videoType?: 'YOUTUBE' | 'VIMEO' | 'UPLOAD' | null;
    pdfUrl?: string | null;
    quizId?: string | null;
  }>;
}

export interface CourseProgress {
  enrollmentId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  enrolledAt: string;
  completedAt: string | null;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  modules: ModuleProgress[];
}

export const enrollmentsApi = {
  enroll: async (courseId: string) => {
    const response = await api.post<ApiResponse<Enrollment>>('/api/enrollments', { courseId });
    return response.data;
  },

  getMyEnrollments: async (status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED') => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<ApiResponse<Enrollment[]>>(`/api/enrollments/my-courses${params}`);
    return response.data;
  },

  getCourseProgress: async (courseId: string) => {
    const response = await api.get<ApiResponse<CourseProgress>>(`/api/enrollments/${courseId}/progress`);
    return response.data;
  },

  markLessonComplete: async (courseId: string, lessonId: string, watchedSeconds?: number) => {
    const response = await api.patch<ApiResponse<{ lessonProgress: LessonProgress; courseCompleted: boolean }>>(
      `/api/enrollments/${courseId}/lessons/${lessonId}/complete`,
      { watchedSeconds }
    );
    return response.data;
  },
};
