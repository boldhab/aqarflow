import { publicPortalRepository, PublicPortalRepository } from './public-portal.repository';
import { PublicListingQuery, PublicInquiryInput } from './public-portal.schema';
import { ApiError } from '@/shared/errors';

export class PublicPortalService {
  constructor(private repo: PublicPortalRepository = publicPortalRepository) {}

  async getPublicListings(query: PublicListingQuery) {
    return this.repo.findPublishedProperties(query);
  }

  async getPublicPropertyDetails(id: string) {
    const property = await this.repo.findPublishedPropertyById(id);
    if (!property) {
      throw ApiError.notFound('Property not found or is no longer available');
    }
    return property;
  }

  async submitInquiry(input: PublicInquiryInput) {
    return this.repo.createLeadInquiry(input);
  }
}

export const publicPortalService = new PublicPortalService();
