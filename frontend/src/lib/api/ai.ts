import { api, ApiResponse } from '@/lib/api';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface QuizGenerationRequest {
  content: string;
  numQuestions?: number;
  questionTypes?: QuestionType[];
  difficulty?: Difficulty;
  topic?: string;
}

export interface QuizOption {
  optionText: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  questionText: string;
  type: QuestionType;
  options: QuizOption[];
  explanation: string | null;
  points: number;
  sampleAnswer?: string;
}

export interface QuizGenerationResponse {
  success: boolean;
  title: string;
  questions: GeneratedQuestion[];
  isAiGenerated: boolean;
}

export interface ContentSummaryRequest {
  content: string;
  title?: string;
}

export interface ContentSummaryResponse {
  success: boolean;
  keyPoints: string[];
  summary: string;
  keywords: string[];
}

export const aiApi = {
  generateQuiz: async (request: QuizGenerationRequest) => {
    const response = await api.post<ApiResponse<QuizGenerationResponse>>(
      '/api/ai/quiz-generator/generate',
      request
    );
    return response.data;
  },

  summarizeContent: async (request: ContentSummaryRequest) => {
    const response = await api.post<ApiResponse<ContentSummaryResponse>>(
      '/api/ai/content-summarizer/summarize',
      request
    );
    return response.data;
  },
};
