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
    const token = localStorage.getItem('zklms-token');
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
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Dicka shkoi gabim';

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zklms-token');
        localStorage.removeItem('zklms-user');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    } else if (status && status >= 500) {
      toast.error('Gabim ne server. Ju lutem provoni perseri me vone.');
    }

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
