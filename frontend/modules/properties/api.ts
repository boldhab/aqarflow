import { apiClient } from '@/shared/lib';
import { PropertyItem } from './types';

export const propertiesApi = {
  list: async (token?: string): Promise<{ success: boolean; data: { items: PropertyItem[]; total: number } }> => {
    return apiClient('/properties', { token });
  },
  getById: async (id: string, token?: string): Promise<{ success: boolean; data: PropertyItem }> => {
    return apiClient(`/properties/${id}`, { token });
  },
};
