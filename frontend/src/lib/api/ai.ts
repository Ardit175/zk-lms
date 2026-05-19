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

export type ExtractionSourceType = 'pdf' | 'youtube' | 'audio';

export interface ExtractionResult {
  success: boolean;
  sourceType: ExtractionSourceType;
  sourceLabel: string;
  content: string;
  charCount: number;
  truncated: boolean;
  metadata: Record<string, unknown>;
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

  extractPdf: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<ExtractionResult>>(
      '/api/ai/extract/pdf',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180_000 }
    );
    return response.data;
  },

  extractYoutube: async (url: string, language?: string) => {
    const response = await api.post<ApiResponse<ExtractionResult>>(
      '/api/ai/extract/youtube',
      { url, language },
      { timeout: 180_000 }
    );
    return response.data;
  },

  extractAudio: async (file: File, label?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (label) form.append('label', label);
    const response = await api.post<ApiResponse<ExtractionResult>>(
      '/api/ai/extract/audio',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300_000 }
    );
    return response.data;
  },
};
