import prisma from '@/config/db';
import { PublicListingQuery, PublicInquiryInput } from './public-portal.schema';

export class PublicPortalRepository {
  async findPublishedProperties(query: PublicListingQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'AVAILABLE',
      ...(query.agencySlug ? { agency: { slug: query.agencySlug } } : {}),
      ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.bedrooms !== undefined ? { bedrooms: query.bedrooms } : {}),
    };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: true,
          agency: { select: { id: true, name: true, slug: true, phone: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublishedPropertyById(id: string) {
    return prisma.property.findFirst({
      where: { id, status: 'AVAILABLE' },
      include: {
        images: true,
        agency: { select: { id: true, name: true, slug: true, phone: true, email: true } },
      },
    });
  }

  async createLeadInquiry(data: PublicInquiryInput) {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          agencyId: data.agencyId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          stage: 'NEW',
          source: data.propertyId ? 'PROPERTY_INQUIRY' : 'PUBLIC_PORTAL',
        },
      });

      if (data.message || data.propertyId) {
        await tx.leadNote.create({
          data: {
            agencyId: data.agencyId,
            leadId: lead.id,
            content: `Inquiry received${data.propertyId ? ` for property ${data.propertyId}` : ''}. Message: ${data.message || 'No additional message'}`,
          },
        });
      }

      return lead;
    });
  }
}

export const publicPortalRepository = new PublicPortalRepository();
