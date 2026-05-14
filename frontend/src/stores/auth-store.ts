'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authApi, User } from '@/lib/api';

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'INSTRUCTOR' | 'STUDENT';
  }) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('zklms-token', token);
            Cookies.set('zklms-token', token, { expires: 7 });
            Cookies.set('zklms-user', JSON.stringify({ role: user.role }), { expires: 7 });
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.error || 'Login failed',
            });
            throw new Error(response.error || 'Login failed');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('zklms-token', token);
            Cookies.set('zklms-token', token, { expires: 7 });
            Cookies.set('zklms-user', JSON.stringify({ role: user.role }), { expires: 7 });
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.error || 'Registration failed',
            });
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('zklms-token');
        Cookies.remove('zklms-token');
        Cookies.remove('zklms-user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      initialize: async () => {
        const token = localStorage.getItem('zklms-token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await authApi.getMe();
          if (response.success && response.data) {
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            get().logout();
          }
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'zklms-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const getRedirectPath = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'INSTRUCTOR':
      return '/instructor/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    default:
      return '/';
  }
};
