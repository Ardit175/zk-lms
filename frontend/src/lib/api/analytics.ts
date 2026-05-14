import { api, ApiResponse } from '@/lib/api';

export interface CourseAnalytics {
  overview: {
    totalStudents: number;
    completionRate: number;
    averageScore: number;
    averageRating: number;
  };
  enrollmentOverTime: Array<{
    date: string;
    count: number;
  }>;
  progressDistribution: Array<{
    range: string;
    count: number;
  }>;
  moduleCompletion: Array<{
    moduleTitle: string;
    lessonsCount: number;
    completionRate: number;
    avgTimeMinutes: number;
  }>;
  hardestQuestions: Array<{
    questionText: string;
    quizTitle: string;
    wrongAnswerRate: number;
    totalAnswers: number;
  }>;
  recentActivity: Array<{
    studentName: string;
    action: string;
    timestamp: string;
    type: 'lesson_completed' | 'enrollment';
  }>;
}

export const analyticsApi = {
  getCourseAnalytics: async (courseId: string, days = 30) => {
    const response = await api.get<ApiResponse<CourseAnalytics>>(
      `/api/instructor/courses/${courseId}/analytics?days=${days}`
    );
    return response.data;
  },
};
