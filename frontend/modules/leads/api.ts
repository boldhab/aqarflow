import { apiClient } from '@/shared/lib';
import { LeadItem } from './types';

export const leadsApi = {
  list: async (
    paramsOrToken?: { stage?: string; page?: number; limit?: number } | string,
    maybeToken?: string
  ): Promise<{ success: boolean; data: { items: LeadItem[]; total: number; totalPages: number } }> => {
    let params: { stage?: string; page?: number; limit?: number } | undefined;
    let token: string | undefined;

    if (typeof paramsOrToken === 'string') {
      token = paramsOrToken;
    } else {
      params = paramsOrToken;
      token = maybeToken;
    }

    const query = new URLSearchParams();
    if (params?.stage) query.append('stage', params.stage);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/leads${qs}`, { token });
  },

  getById: async (id: string, token?: string): Promise<{ success: boolean; data: LeadItem }> => {
    return apiClient(`/leads/${id}`, { token });
  },
};
