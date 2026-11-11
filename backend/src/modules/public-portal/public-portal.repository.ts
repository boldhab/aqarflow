import prisma from '@/config/db';
import { PublicPropertiesQuery } from './public-portal.schema';
import { PropertyPurpose, PropertyType, PropertyStatus, PreferredContact } from '@prisma/client';

export interface CreateInquiryRecord {
  agencyId: string;
  propertyId?: string | null;
  assignedAgentId?: string | null;
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string | null;
  normalizedEmail?: string | null;
  message?: string | null;
  preferredContact: PreferredContact;
  purpose?: PropertyPurpose | null;
}

const VISIBLE_STATUSES: PropertyStatus[] = [
  PropertyStatus.AVAILABLE,
  PropertyStatus.RESERVED,
  PropertyStatus.UNDER_OFFER,
];

export class PublicPortalRepository {
  async findAgencyBySlug(slug: string) {
    return prisma.agency.findUnique({
      where: { slug },
    });
  }

  async findPublishedProperties(agencyId: string, query: PublicPropertiesQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 24) : 12;
    const skip = (page - 1) * limit;

    const where: any = {
      agencyId,
      isPublished: true,
      deletedAt: null,
      status: { in: VISIBLE_STATUSES },
    };

    if (query.purpose) {
      where.purpose = query.purpose;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.bedrooms !== undefined) {
      where.bedrooms = query.bedrooms;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { locality: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
        skip,
        take: limit,
        orderBy,
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

  async findPublishedPropertyById(id: string, agencyId: string) {
    return prisma.property.findFirst({
      where: {
        id,
        agencyId,
        isPublished: true,
        deletedAt: null,
        status: { in: VISIBLE_STATUSES },
      },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          },
        },
        agency: {
          select: {
            name: true,
            slug: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async findFilterValues(agencyId: string) {
    const properties = await prisma.property.findMany({
      where: {
        agencyId,
        isPublished: true,
        deletedAt: null,
        status: { in: VISIBLE_STATUSES },
      },
      select: {
        city: true,
        type: true,
      },
    });

    const citySet = new Set<string>();
    const typeSet = new Set<string>();

    for (const p of properties) {
      if (p.city && p.city.trim()) {
        citySet.add(p.city.trim());
      }
      if (p.type) {
        typeSet.add(p.type);
      }
    }

    return {
      cities: Array.from(citySet).sort(),
      types: Array.from(typeSet).sort(),
    };
  }

  async createInquiry(data: CreateInquiryRecord) {
    return prisma.lead.create({
      data: {
        agencyId: data.agencyId,
        propertyId: data.propertyId || null,
        assignedAgentId: data.assignedAgentId || null,
        name: data.name,
        phone: data.phone,
        normalizedPhone: data.normalizedPhone,
        email: data.email || null,
        normalizedEmail: data.normalizedEmail || null,
        message: data.message || null,
        preferredContact: data.preferredContact,
        purpose: data.purpose || null,
        source: 'WEBSITE',
        stage: 'NEW',
      },
      select: {
        id: true,
      },
    });
  }
}

export const publicPortalRepository = new PublicPortalRepository();
