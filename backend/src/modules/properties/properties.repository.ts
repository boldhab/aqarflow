import prisma from '@/config/db';
import { CreatePropertyInput, UpdatePropertyInput, ListPropertiesQuery } from './properties.schema';
import { PropertyStatus } from '@prisma/client';

export class PropertiesRepository {
  async findById(id: string, agencyId: string) {
    return prisma.property.findFirst({
      where: { id, agencyId },
      include: { images: true, createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(agencyId: string, query: ListPropertiesQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      agencyId,
      ...(query.status ? { status: query.status as PropertyStatus } : {}),
      ...(query.city ? { city: { contains: query.city, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { images: true },
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

  async create(agencyId: string, userId: string, data: CreatePropertyInput) {
    return prisma.property.create({
      data: {
        agencyId,
        createdById: userId,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        type: data.type,
        status: data.status,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSqFt: data.areaSqFt,
        address: data.address,
        city: data.city,
        country: data.country,
      },
      include: { images: true },
    });
  }

  async update(id: string, agencyId: string, data: UpdatePropertyInput) {
    return prisma.property.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.currency ? { currency: data.currency } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.bedrooms !== undefined ? { bedrooms: data.bedrooms } : {}),
        ...(data.bathrooms !== undefined ? { bathrooms: data.bathrooms } : {}),
        ...(data.areaSqFt !== undefined ? { areaSqFt: data.areaSqFt } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
      },
      include: { images: true },
    });
  }

  async delete(id: string, agencyId: string) {
    return prisma.property.deleteMany({
      where: { id, agencyId },
    });
  }
}

export const propertiesRepository = new PropertiesRepository();
