import crypto from 'crypto';
import { publicPortalRepository, PublicPortalRepository } from './public-portal.repository';
import { PublicPropertiesQuery, PublicInquiryInput, publicPropertiesQuerySchema } from './public-portal.schema';
import {
  PublicPropertySummaryDTO,
  PublicPropertyDetailDTO,
  PublicFiltersDTO,
  PublicPropertyImage,
} from './public-portal.types';
import { env } from '@/config/env';
import { ApiError } from '@/shared/errors';
import { validateAndNormalizePakistaniPhone, sanitizeInput } from './public-portal.utils';
import { PreferredContact } from '@prisma/client';

export class PublicPortalService {
  constructor(private repo: PublicPortalRepository = publicPortalRepository) {}

  private async getDefaultAgency() {
    const slug = env.DEFAULT_AGENCY_SLUG || 'demo-agency';
    const agency = await this.repo.findAgencyBySlug(slug);
    if (!agency) {
      throw ApiError.notFound(`Default agency with slug "${slug}" not found`);
    }
    return agency;
  }

  private mapImages(images: any[]): PublicPropertyImage[] {
    return (images || []).map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      isPrimary: Boolean(img.isPrimary),
      sortOrder: img.sortOrder ?? 0,
    }));
  }

  private mapSummary(property: any): PublicPropertySummaryDTO {
    const mappedImages = this.mapImages(property.images);
    const primaryImage =
      mappedImages.find((img) => img.isPrimary) || (mappedImages.length > 0 ? mappedImages[0] : null);

    return {
      id: property.id,
      referenceCode: property.referenceCode,
      title: property.title,
      description: property.description,
      purpose: property.purpose,
      type: property.type,
      status: property.status,
      price: property.price ? Number(property.price) : 0,
      currency: property.currency || 'PKR',
      areaValue: property.areaValue ? Number(property.areaValue) : 0,
      areaUnit: property.areaUnit,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      city: property.city,
      locality: property.locality,
      address: property.address,
      primaryImage,
      images: mappedImages,
      createdAt: property.createdAt,
    };
  }

  async getPublicProperties(query: any) {
    const parsedQuery = publicPropertiesQuerySchema.shape.query.parse(query);
    const agency = await this.getDefaultAgency();
    const result = await this.repo.findPublishedProperties(agency.id, parsedQuery);

    return {
      items: result.items.map((item) => this.mapSummary(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getPublicPropertyDetails(id: string): Promise<PublicPropertyDetailDTO> {
    const agency = await this.getDefaultAgency();
    const property = await this.repo.findPublishedPropertyById(id, agency.id);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const summary = this.mapSummary(property);

    return {
      ...summary,
      latitude: property.latitude,
      longitude: property.longitude,
      assignedAgent: property.assignedAgent
        ? {
            name: property.assignedAgent.name,
            phone: property.assignedAgent.phone || null,
          }
        : null,
      agency: {
        name: property.agency?.name || agency.name,
        slug: property.agency?.slug || agency.slug,
        phone: property.agency?.phone || agency.phone || null,
        email: property.agency?.email || agency.email || null,
      },
    };
  }

  async getFilterOptions(): Promise<PublicFiltersDTO> {
    const agency = await this.getDefaultAgency();
    return this.repo.findFilterValues(agency.id);
  }

  async submitInquiry(input: PublicInquiryInput): Promise<{ id: string }> {
    // 1. Honeypot check: If honeypot is populated, return pseudo 201 without storing
    if (input.honeypot || input.hp_name) {
      return { id: crypto.randomUUID() };
    }

    const agency = await this.getDefaultAgency();

    // 2. Validate Pakistani phone
    const phoneCheck = validateAndNormalizePakistaniPhone(input.phone);
    if (!phoneCheck.isValid || !phoneCheck.normalized) {
      throw ApiError.badRequest('Please enter a valid Pakistani phone number');
    }

    // 3. Normalize email & sanitize strings
    const name = sanitizeInput(input.name);
    if (!name || name.length < 2) {
      throw ApiError.badRequest('Name must be at least 2 characters');
    }

    const normalizedEmail = input.email?.trim() ? input.email.trim().toLowerCase() : null;
    const message = sanitizeInput(input.message) || null;

    let assignedAgentId: string | null = null;
    let purpose: any = null;

    // 4. Verify property visibility if propertyId is provided
    if (input.propertyId && input.propertyId.trim()) {
      const property = await this.repo.findPublishedPropertyById(input.propertyId, agency.id);
      if (!property) {
        throw ApiError.notFound('Property not found or is no longer available');
      }
      assignedAgentId = (property as any).assignedAgentId || null;
      purpose = property.purpose;
    }

    const lead = await this.repo.createInquiry({
      agencyId: agency.id,
      propertyId: input.propertyId || null,
      assignedAgentId,
      name,
      phone: input.phone.trim(),
      normalizedPhone: phoneCheck.normalized,
      email: normalizedEmail,
      normalizedEmail,
      message,
      preferredContact: input.preferredContact as PreferredContact,
      purpose,
    });

    return { id: lead.id };
  }
}

export const publicPortalService = new PublicPortalService();
