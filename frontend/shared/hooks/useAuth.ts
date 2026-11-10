'use client';

import { useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  agencyId: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('aqarflow_token');
      const storedUser = localStorage.getItem('aqarflow_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Local storage not available in SSR
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (jwtToken: string, userPayload: UserSession) => {
    localStorage.setItem('aqarflow_token', jwtToken);
    localStorage.setItem('aqarflow_user', JSON.stringify(userPayload));
    setToken(jwtToken);
    setUser(userPayload);
  };

  const logout = () => {
    localStorage.removeItem('aqarflow_token');
    localStorage.removeItem('aqarflow_user');
    setToken(null);
    setUser(null);
  };

  return { user, token, isLoading, isAuthenticated: !!token, login, logout };
}
