import { apiClient } from '@/shared/lib';
import { LeadItem } from './types';

export const leadsApi = {
  list: async (token?: string): Promise<{ success: boolean; data: { items: LeadItem[]; total: number } }> => {
    return apiClient('/leads', { token });
  },
  getById: async (id: string, token?: string): Promise<{ success: boolean; data: LeadItem }> => {
    return apiClient(`/leads/${id}`, { token });
  },
};
