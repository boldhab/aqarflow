import { apiClient } from '@/shared/lib';
import {
  PublicListingItem,
  PublicListingDetail,
  PublicPropertyFilters,
  PublicFiltersData,
  InquiryFormData,
  PaginatedPublicListings,
} from './types';

export const publicPortalApi = {
  getProperties: async (
    params?: PublicPropertyFilters
  ): Promise<{ success: boolean; data: PaginatedPublicListings }> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.purpose) query.append('purpose', params.purpose);
      if (params.type) query.append('type', params.type);
      if (params.city) query.append('city', params.city);
      if (params.minPrice) query.append('minPrice', String(params.minPrice));
      if (params.maxPrice) query.append('maxPrice', String(params.maxPrice));
      if (params.bedrooms) query.append('bedrooms', String(params.bedrooms));
      if (params.search) query.append('search', params.search);
      if (params.sort) query.append('sort', params.sort);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/public/properties${qs}`, { skipAuthRedirect: true });
  },

  getPropertyById: async (
    id: string
  ): Promise<{ success: boolean; data: PublicListingDetail }> => {
    return apiClient(`/public/properties/${id}`, { skipAuthRedirect: true });
  },

  getFilters: async (): Promise<{ success: boolean; data: PublicFiltersData }> => {
    return apiClient('/public/filters', { skipAuthRedirect: true });
  },

  submitInquiry: async (
    data: InquiryFormData
  ): Promise<{ success: boolean; message: string; data: { id: string } }> => {
    return apiClient('/public/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuthRedirect: true,
    });
  },

  // Backwards compatibility
  getListings: async (): Promise<{ success: boolean; data: { items: PublicListingItem[]; total: number } }> => {
    const res = await publicPortalApi.getProperties();
    return {
      success: res.success,
      data: {
        items: res.data.items,
        total: res.data.total,
      },
    };
  },
  getListingById: async (id: string): Promise<{ success: boolean; data: PublicListingItem }> => {
    return publicPortalApi.getPropertyById(id);
  },
};
