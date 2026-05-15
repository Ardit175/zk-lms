import { api, ApiResponse } from '@/lib/api';

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50MB
export const PDF_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadsApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<UploadResult>>('/api/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
