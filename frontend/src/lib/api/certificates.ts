import { api, ApiResponse } from '@/lib/api';
import { resolveFileUrl } from '@/lib/fileUrl';

export interface Certificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: string;
  pdfUrl: string | null;
  course: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    instructorName: string;
  };
}

export interface CertificateVerification {
  studentName: string;
  courseName: string;
  instructorName: string;
  issuedAt: string;
  certificateNumber: string;
  isValid: boolean;
}

export const certificatesApi = {
  getMyCertificates: async () => {
    const response = await api.get<ApiResponse<Certificate[]>>('/api/certificates/my-certificates');
    return response.data;
  },

  verify: async (verificationCode: string) => {
    const response = await api.get<ApiResponse<CertificateVerification>>(
      `/api/certificates/${verificationCode}/verify`
    );
    return response.data;
  },

  getDownloadUrl: (certificateId: string) => {
    return resolveFileUrl(`/api/certificates/${certificateId}/download`);
  },
};
