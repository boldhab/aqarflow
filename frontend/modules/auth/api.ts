import { apiClient } from '@/shared/lib';
import { LoginCredentials, AuthApiResponse } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthApiResponse> => {
    return apiClient<AuthApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async (): Promise<AuthApiResponse> => {
    return apiClient<AuthApiResponse>('/auth/me', {
      method: 'GET',
      skipAuthRedirect: true,
    });
  },

  logout: async (): Promise<void> => {
    await apiClient<void>('/auth/logout', {
      method: 'POST',
      skipAuthRedirect: true,
    });
  },
};
