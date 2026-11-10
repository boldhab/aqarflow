'use client';

import { useState } from 'react';
import { authApi } from './api';
import { LoginCredentials } from './types';
import { useAuth } from '@/shared/hooks';

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: saveSession } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      saveSession(res.data.tokens.accessToken, res.data.user);
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
}
