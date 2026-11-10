import { apiClient } from '@/shared/lib';
import { PublicListingItem, InquiryFormData } from './types';

export const publicPortalApi = {
  getListings: async (): Promise<{ success: boolean; data: { items: PublicListingItem[]; total: number } }> => {
    return apiClient('/portal/listings');
  },
  getListingById: async (id: string): Promise<{ success: boolean; data: PublicListingItem }> => {
    return apiClient(`/portal/listings/${id}`);
  },
  submitInquiry: async (data: InquiryFormData): Promise<{ success: boolean; message: string }> => {
    return apiClient('/portal/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
