import { apiClient } from '@/shared/lib';
import { LoginCredentials, AuthSession } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ success: boolean; data: AuthSession }> => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};
