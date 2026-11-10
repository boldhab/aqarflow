import { apiClient } from '@/shared/lib';
import { DashboardData } from './types';

export const dashboardApi = {
  getOverview: async (token?: string): Promise<{ success: boolean; data: DashboardData }> => {
    return apiClient('/dashboard/overview', { token });
  },
};
