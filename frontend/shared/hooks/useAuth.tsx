'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/modules/auth/api';
import { User, Agency, UserRole, LoginCredentials } from '@/modules/auth/types';

export interface AuthContextValue {
  user: User | null;
  agency: Agency | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token?: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const handleUnauthorized = () => {
      setUser(null);
      if (typeof document !== 'undefined') {
        document.cookie = 'aqarflow_session=; path=/; max-age=0; SameSite=Lax';
      }
    };

    window.addEventListener('aqarflow:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('aqarflow:unauthorized', handleUnauthorized);
    };
  }, [refreshSession]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      const loggedInUser = response.data.user;
      setUser(loggedInUser);
      if (typeof document !== 'undefined') {
        document.cookie = 'aqarflow_session=1; path=/; max-age=604800; SameSite=Lax';
      }
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      if (typeof document !== 'undefined') {
        document.cookie = 'aqarflow_session=; path=/; max-age=0; SameSite=Lax';
      }
      setUser(null);
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    agency: user?.agency ?? null,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
    token: undefined,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
