import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('eduai-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.error || error.response?.data?.message;

    // Network/timeout error — no response received
    if (!error.response) {
      toast.error('Nuk u arrit serveri. Kontrolloni lidhjen e internetit.');
      return Promise.reject(error);
    }

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('eduai-token');
        localStorage.removeItem('eduai-user');
        const path = window.location.pathname;
        if (!path.includes('/login') && !path.includes('/register')) {
          toast.error('Sesioni juaj skadoi. Ju lutem hyni perseri.');
          window.location.href = '/login';
        }
      }
    } else if (status === 403) {
      toast.error(serverMessage || 'Nuk keni leje per kete veprim.');
    } else if (status === 422 || status === 400) {
      toast.error(serverMessage || 'Te dhena te pavlefshme. Kontrolloni dhe provoni perseri.');
    } else if (status === 409) {
      toast.error(serverMessage || 'Konflikt: ky veprim mund te jete kryer tashme.');
    } else if (status === 429) {
      toast.error('Shume kerkesa. Prisni pak dhe provoni perseri.');
    } else if (status && status >= 500) {
      toast.error('Gabim ne server. Ju lutem provoni perseri me vone.');
    }
    // 404 is intentionally not toasted globally — many flows use it as
    // "not found yet" (e.g. getMySubmission) and handle it locally.

    return Promise.reject(error);
  }
);

export function showSuccessToast(message: string) {
  toast.success(message);
}

export function showErrorToast(message: string) {
  toast.error(message);
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'INSTRUCTOR' | 'STUDENT';
  }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/api/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/logout');
    return response.data;
  },
};
