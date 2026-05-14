import { api, ApiResponse } from '@/lib/api';

export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';

export interface LiveSession {
  id: string;
  courseId: string;
  instructorId: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: LiveSessionStatus;
  recordingUrl: string | null;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  questions?: LiveQuestion[];
  _count?: {
    questions: number;
  };
}

export interface LiveQuestion {
  id: string;
  sessionId: string;
  studentId: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  askedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateLiveSessionInput {
  courseId: string;
  title: string;
  description?: string;
  scheduledAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export const liveSessionsApi = {
  // Instructor endpoints
  create: async (data: CreateLiveSessionInput) => {
    const response = await api.post<ApiResponse<LiveSession>>('/api/live-sessions', data);
    return response.data;
  },

  getMySessions: async () => {
    const response = await api.get<ApiResponse<LiveSession[]>>('/api/live-sessions/my-sessions');
    return response.data;
  },

  start: async (sessionId: string) => {
    const response = await api.patch<ApiResponse<LiveSession>>(`/api/live-sessions/${sessionId}/start`);
    return response.data;
  },

  end: async (sessionId: string) => {
    const response = await api.patch<ApiResponse<LiveSession>>(`/api/live-sessions/${sessionId}/end`);
    return response.data;
  },

  markAnswered: async (sessionId: string, questionId: string) => {
    const response = await api.patch<ApiResponse<LiveQuestion>>(
      `/api/live-sessions/${sessionId}/questions/${questionId}/answer`
    );
    return response.data;
  },

  // Student endpoints
  getUpcoming: async () => {
    const response = await api.get<ApiResponse<LiveSession[]>>('/api/live-sessions/upcoming');
    return response.data;
  },

  askQuestion: async (sessionId: string, questionText: string) => {
    const response = await api.post<ApiResponse<LiveQuestion>>(
      `/api/live-sessions/${sessionId}/questions`,
      { questionText }
    );
    return response.data;
  },

  upvoteQuestion: async (sessionId: string, questionId: string) => {
    const response = await api.patch<ApiResponse<LiveQuestion>>(
      `/api/live-sessions/${sessionId}/questions/${questionId}/upvote`
    );
    return response.data;
  },

  // Shared
  getSession: async (sessionId: string) => {
    const response = await api.get<ApiResponse<LiveSession>>(`/api/live-sessions/${sessionId}`);
    return response.data;
  },
};
