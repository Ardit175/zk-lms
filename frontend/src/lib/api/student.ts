import { api, ApiResponse } from '@/lib/api';

export interface StudentStats {
  studyHours: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  certificates: number;
  streakDays: number;
  lastStudiedAt: string | null;
}

export interface UpcomingDeadline {
  id: string;
  type: 'assignment';
  title: string;
  courseName: string;
  courseId: string;
  lessonId: string;
  dueDate: string;
}

export interface Competency {
  category: string;
  score: number;
  quizzesTaken: number;
}

export interface ContinueLearning {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  instructorName: string;
  progressPercent: number;
  nextLessonId: string | null;
  lastAccessedAt: string | null;
}

export const studentApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<StudentStats>>('/api/student/stats');
    return response.data;
  },

  getDeadlines: async () => {
    const response = await api.get<ApiResponse<UpcomingDeadline[]>>('/api/student/deadlines');
    return response.data;
  },

  getCompetencies: async () => {
    const response = await api.get<ApiResponse<Competency[]>>('/api/student/competencies');
    return response.data;
  },

  getContinueLearning: async () => {
    const response = await api.get<ApiResponse<ContinueLearning | null>>('/api/student/continue-learning');
    return response.data;
  },
};
