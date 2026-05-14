import { api, ApiResponse } from '@/lib/api';

export type SubmissionType = 'TEXT' | 'FILE' | 'LINK';

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string | null;
  maxScore: number;
  submissionType: SubmissionType;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  linkUrl: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy?: {
    firstName: string;
    lastName: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface CourseAssignment {
  id: string;
  title: string;
  lessonTitle: string;
  dueDate: string | null;
  maxScore: number;
  submissionType: SubmissionType;
  totalSubmissions: number;
  gradedCount: number;
  ungradedCount: number;
  averageScore: number | null;
}

export interface SubmitAssignmentInput {
  content?: string;
  fileUrl?: string;
  linkUrl?: string;
}

export interface GradeSubmissionInput {
  score: number;
  feedback?: string;
}

export const assignmentsApi = {
  // Student endpoints
  getByLesson: async (lessonId: string) => {
    const response = await api.get<ApiResponse<Assignment>>(
      `/api/assignments/lesson/${lessonId}`
    );
    return response.data;
  },

  submit: async (assignmentId: string, data: SubmitAssignmentInput) => {
    const response = await api.post<ApiResponse<AssignmentSubmission>>(
      `/api/assignments/${assignmentId}/submit`,
      data
    );
    return response.data;
  },

  getMySubmission: async (assignmentId: string) => {
    const response = await api.get<ApiResponse<AssignmentSubmission | null>>(
      `/api/assignments/${assignmentId}/my-submission`
    );
    return response.data;
  },

  // Instructor endpoints
  getCourseAssignments: async (courseId: string) => {
    const response = await api.get<ApiResponse<{ assignments: CourseAssignment[]; courseTitle: string }>>(
      `/api/assignments/course/${courseId}`
    );
    return response.data;
  },

  getSubmissions: async (assignmentId: string) => {
    const response = await api.get<ApiResponse<{
      submissions: AssignmentSubmission[];
      stats: { total: number; graded: number; ungraded: number; averageScore: number | null };
      assignment: Assignment;
    }>>(`/api/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  gradeSubmission: async (submissionId: string, data: GradeSubmissionInput) => {
    const response = await api.patch<ApiResponse<AssignmentSubmission>>(
      `/api/assignments/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  },

  // Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{
      url: string;
      filename: string;
      originalName: string;
      size: number;
      mimetype: string;
    }>>('/api/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
