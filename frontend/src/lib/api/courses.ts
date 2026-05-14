import { api, ApiResponse } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  orderIndex: number;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  isPreview: boolean;
  isPublished: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnailUrl?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  price: number;
  totalDuration: number;
  enrollmentCount: number;
  completionRate?: number;
  averageRating?: number;
  instructorId: string;
  categoryId?: string;
  category?: Category;
  modules?: Module[];
  createdAt: string;
  updatedAt: string;
}

export const coursesApi = {
  getInstructorCourses: async () => {
    const response = await api.get<ApiResponse<Course[]>>('/api/courses/my-courses');
    return response.data;
  },

  getModules: async (courseId: string) => {
    const response = await api.get<ApiResponse<Module[]>>(`/api/courses/${courseId}/modules`);
    return response.data;
  },

  getCourseById: async (id: string) => {
    const response = await api.get<ApiResponse<Course>>(`/api/courses/${id}`);
    return response.data;
  },

  getCourseForEdit: async (id: string) => {
    const [courseRes, modulesRes] = await Promise.all([
      api.get<ApiResponse<Course>>(`/api/courses/slug/${id}`),
      api.get<ApiResponse<Module[]>>(`/api/courses/${id}/modules`),
    ]);
    return {
      course: courseRes.data.data,
      modules: modulesRes.data.data,
    };
  },

  createCourse: async (data: { title: string; description: string; categoryId?: string; level?: string }) => {
    const response = await api.post<ApiResponse<Course>>('/api/courses', data);
    return response.data;
  },

  updateCourse: async (id: string, data: Partial<Course>) => {
    const response = await api.put<ApiResponse<Course>>(`/api/courses/${id}`, data);
    return response.data;
  },

  updateCourseStatus: async (id: string, status: Course['status']) => {
    const response = await api.patch<ApiResponse<Course>>(`/api/courses/${id}/status`, { status });
    return response.data;
  },

  deleteCourse: async (id: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/courses/${id}`);
    return response.data;
  },

  // Modules
  createModule: async (courseId: string, data: { title: string; description?: string }) => {
    const response = await api.post<ApiResponse<Module>>(`/api/courses/${courseId}/modules`, data);
    return response.data;
  },

  updateModule: async (courseId: string, moduleId: string, data: Partial<Module>) => {
    const response = await api.put<ApiResponse<Module>>(`/api/courses/${courseId}/modules/${moduleId}`, data);
    return response.data;
  },

  deleteModule: async (courseId: string, moduleId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  reorderModules: async (courseId: string, modules: { id: string; orderIndex: number }[]) => {
    const response = await api.patch<ApiResponse<{ message: string }>>(`/api/courses/${courseId}/modules/reorder`, { modules });
    return response.data;
  },

  // Lessons
  createLesson: async (courseId: string, moduleId: string, data: Partial<Lesson>) => {
    const response = await api.post<ApiResponse<Lesson>>(`/api/courses/${courseId}/modules/${moduleId}/lessons`, data);
    return response.data;
  },

  updateLesson: async (courseId: string, moduleId: string, lessonId: string, data: Partial<Lesson>) => {
    const response = await api.put<ApiResponse<Lesson>>(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data);
    return response.data;
  },

  deleteLesson: async (courseId: string, moduleId: string, lessonId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
    return response.data;
  },

  reorderLessons: async (courseId: string, moduleId: string, lessons: { id: string; orderIndex: number }[]) => {
    const response = await api.patch<ApiResponse<{ message: string }>>(`/api/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { lessons });
    return response.data;
  },
};

export const categoriesApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Category[]>>('/api/categories');
    return response.data;
  },
};
