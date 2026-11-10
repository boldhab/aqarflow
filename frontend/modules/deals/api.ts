import { apiClient } from '@/shared/lib';
import { DealItem } from './types';

export const dealsApi = {
  list: async (token?: string): Promise<{ success: boolean; data: { items: DealItem[]; total: number } }> => {
    return apiClient('/deals', { token });
  },
};
