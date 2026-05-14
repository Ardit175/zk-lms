import { api, ApiResponse } from '@/lib/api';

export interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  questionCount: number;
  attemptsUsed: number;
  attemptsRemaining: number;
}

export interface QuizOption {
  id: string;
  optionText: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  points: number;
  options: QuizOption[];
}

export interface QuizAttemptStart {
  attemptId: string;
  timeLimit: number | null;
  questions: QuizQuestion[];
}

export interface QuizResult {
  questionId: string;
  questionText: string;
  type: string;
  studentAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation: string | null;
}

export interface QuizSubmitResponse {
  score: number;
  earnedPoints: number;
  totalPoints: number;
  isPassed: boolean;
  passingScore: number;
  results: QuizResult[];
}

export interface QuizAttemptHistory {
  id: string;
  attemptNumber: number;
  score: number | null;
  isPassed: boolean | null;
  startedAt: string;
  completedAt: string | null;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

export interface CreateQuizInput {
  lessonId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  maxAttempts?: number;
  isAiGenerated?: boolean;
  questions: Array<{
    questionText: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
    orderIndex: number;
    points: number;
    explanation?: string;
    options: Array<{
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}

export interface QuizWithQuestions {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  isAiGenerated: boolean;
  questions: Array<{
    id: string;
    questionText: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
    orderIndex: number;
    points: number;
    explanation: string | null;
    options: Array<{
      id: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}

export const quizzesApi = {
  // Instructor endpoints
  createQuiz: async (data: CreateQuizInput) => {
    const response = await api.post<ApiResponse<QuizWithQuestions>>('/api/quizzes', data);
    return response.data;
  },

  getQuizForEdit: async (lessonId: string) => {
    const response = await api.get<ApiResponse<QuizWithQuestions | null>>(`/api/quizzes/lesson/${lessonId}`);
    return response.data;
  },

  deleteQuiz: async (quizId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/quizzes/${quizId}`);
    return response.data;
  },

  // Student endpoints
  getQuiz: async (quizId: string) => {
    const response = await api.get<ApiResponse<QuizInfo>>(`/api/quizzes/${quizId}`);
    return response.data;
  },

  startAttempt: async (quizId: string) => {
    const response = await api.post<ApiResponse<QuizAttemptStart>>(`/api/quizzes/${quizId}/attempts`);
    return response.data;
  },

  submitAttempt: async (attemptId: string, answers: QuizAnswer[]) => {
    const response = await api.post<ApiResponse<QuizSubmitResponse>>(
      `/api/quizzes/attempts/${attemptId}/submit`,
      { answers }
    );
    return response.data;
  },

  getMyAttempts: async (quizId: string) => {
    const response = await api.get<ApiResponse<QuizAttemptHistory[]>>(`/api/quizzes/${quizId}/my-attempts`);
    return response.data;
  },
};
