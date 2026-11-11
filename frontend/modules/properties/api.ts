import { apiClient } from '@/shared/lib';
import {
  PropertyItem,
  PropertyFilters,
  CreatePropertyPayload,
  UpdatePropertyPayload,
  PaginatedPropertiesResponse,
} from './types';

export const propertiesApi = {
  list: async (
    params?: PropertyFilters,
    token?: string
  ): Promise<PaginatedPropertiesResponse> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.status) query.append('status', params.status);
      if (params.purpose) query.append('purpose', params.purpose);
      if (params.type) query.append('type', params.type);
      if (params.city) query.append('city', params.city);
      if (params.search) query.append('search', params.search);
      if (params.sort) query.append('sort', params.sort);
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/properties${queryString}`, { token });
  },

  getById: async (
    id: string,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem }> => {
    return apiClient(`/properties/${id}`, { token });
  },

  create: async (
    data: CreatePropertyPayload,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem }> => {
    return apiClient('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  update: async (
    id: string,
    data: UpdatePropertyPayload,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem }> => {
    return apiClient(`/properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  },

  delete: async (
    id: string,
    token?: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/properties/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  publish: async (
    id: string,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem; message: string }> => {
    return apiClient(`/properties/${id}/publish`, {
      method: 'PATCH',
      token,
    });
  },

  unpublish: async (
    id: string,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem; message: string }> => {
    return apiClient(`/properties/${id}/unpublish`, {
      method: 'PATCH',
      token,
    });
  },

  uploadImages: async (
    id: string,
    files: File[],
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem; message: string }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    return apiClient(`/properties/${id}/images`, {
      method: 'POST',
      body: formData,
      token,
    });
  },

  setPrimaryImage: async (
    id: string,
    imageId: string,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem; message: string }> => {
    return apiClient(`/properties/${id}/images/${imageId}/primary`, {
      method: 'PATCH',
      token,
    });
  },

  deleteImage: async (
    id: string,
    imageId: string,
    token?: string
  ): Promise<{ success: boolean; data: PropertyItem; message: string }> => {
    return apiClient(`/properties/${id}/images/${imageId}`, {
      method: 'DELETE',
      token,
    });
  },
};
