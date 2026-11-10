'use client';

import { useState } from 'react';
import { authApi } from './api';
import { LoginCredentials } from './types';
import { useAuth } from '@/shared/hooks';

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(credentials);
      return user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
}
