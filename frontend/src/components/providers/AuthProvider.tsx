'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Optional: Show loading state while initializing
  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  return <>{children}</>;
}
