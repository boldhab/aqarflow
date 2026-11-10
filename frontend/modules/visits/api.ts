import { apiClient } from '@/shared/lib';
import { VisitItem } from './types';

export const visitsApi = {
  list: async (token?: string): Promise<{ success: boolean; data: { items: VisitItem[]; total: number } }> => {
    return apiClient('/visits', { token });
  },
};
