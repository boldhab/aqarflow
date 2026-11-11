import prisma from '@/config/db';
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  ListPropertiesQuery,
} from './properties.schema';
import {
  PropertyStatus,
  PropertyPurpose,
  PropertyType,
  Prisma,
} from '@prisma/client';

export class PropertiesRepository {
  async findById(id: string, agencyId: string) {
    return prisma.property.findFirst({
      where: {
        id,
        agencyId,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByReferenceCode(referenceCode: string, agencyId: string) {
    return prisma.property.findUnique({
      where: {
        agencyId_referenceCode: {
          agencyId,
          referenceCode,
        },
      },
    });
  }

  async findAll(agencyId: string, query: ListPropertiesQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      agencyId,
      deletedAt: null,
      ...(query.status ? { status: query.status as PropertyStatus } : {}),
      ...(query.purpose ? { purpose: query.purpose as PropertyPurpose } : {}),
      ...(query.type ? { type: query.type as PropertyType } : {}),
      ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      ...(query.bedrooms !== undefined ? { bedrooms: query.bedrooms } : {}),
      ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
    };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { referenceCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: 'desc' };
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
          createdBy: { select: { id: true, name: true, email: true } },
          assignedAgent: { select: { id: true, name: true, email: true } },
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
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async generateReferenceCode(agencyId: string, tx: Prisma.TransactionClient = prisma): Promise<string> {
    const properties = await tx.property.findMany({
      where: { agencyId },
      select: { referenceCode: true },
    });

    let maxNum = 0;
    for (const p of properties) {
      const match = p.referenceCode.match(/^AF-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `AF-${String(nextNum).padStart(4, '0')}`;
  }

  async create(agencyId: string, userId: string, data: CreatePropertyInput, assignedAgentId: string | null) {
    const doCreate = async () => {
      return prisma.$transaction(async (tx) => {
        let referenceCode = data.referenceCode;
        if (!referenceCode) {
          referenceCode = await this.generateReferenceCode(agencyId, tx);
        }

        const property = await tx.property.create({
          data: {
            agencyId,
            createdById: userId,
            assignedAgentId,
            referenceCode,
            title: data.title,
            description: data.description,
            purpose: data.purpose,
            type: data.type,
            status: data.status,
            price: data.price,
            currency: data.currency,
            areaValue: data.areaValue,
            areaUnit: data.areaUnit,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            address: data.address,
            city: data.city,
            locality: data.locality,
            latitude: data.latitude,
            longitude: data.longitude,
          },
          include: {
            images: true,
            createdBy: { select: { id: true, name: true, email: true } },
            assignedAgent: { select: { id: true, name: true, email: true } },
          },
        });

        return property;
      });
    };

    try {
      return await doCreate();
    } catch (error: any) {
      if (error?.code === 'P2002' && !data.referenceCode) {
        // Retry once on unique constraint conflict for auto-generated reference code
        return await doCreate();
      }
      throw error;
    }
  }

  async update(id: string, agencyId: string, data: UpdatePropertyInput, changedById: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.property.findFirst({
        where: { id, agencyId, deletedAt: null },
      });

      if (!current) {
        return null;
      }

      // If status changed, create history entry
      if (data.status && data.status !== current.status) {
        await tx.propertyStatusHistory.create({
          data: {
            agencyId,
            propertyId: id,
            fromStatus: current.status,
            toStatus: data.status,
            changedById,
          },
        });
      }

      const updated = await tx.property.update({
        where: { id },
        data: {
          ...(data.referenceCode !== undefined ? { referenceCode: data.referenceCode } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.currency !== undefined ? { currency: data.currency } : {}),
          ...(data.areaValue !== undefined ? { areaValue: data.areaValue } : {}),
          ...(data.areaUnit !== undefined ? { areaUnit: data.areaUnit } : {}),
          ...(data.bedrooms !== undefined ? { bedrooms: data.bedrooms } : {}),
          ...(data.bathrooms !== undefined ? { bathrooms: data.bathrooms } : {}),
          ...(data.address !== undefined ? { address: data.address } : {}),
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(data.locality !== undefined ? { locality: data.locality } : {}),
          ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
          ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
          ...(data.assignedAgentId !== undefined ? { assignedAgentId: data.assignedAgentId } : {}),
        },
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
          createdBy: { select: { id: true, name: true, email: true } },
          assignedAgent: { select: { id: true, name: true, email: true } },
          statusHistory: {
            include: {
              changedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return updated;
    });
  }

  async softDelete(id: string, agencyId: string) {
    return prisma.property.updateMany({
      where: { id, agencyId, deletedAt: null },
      data: { deletedAt: new Date(), isPublished: false },
    });
  }

  async setPublishStatus(id: string, agencyId: string, isPublished: boolean) {
    return prisma.property.update({
      where: { id },
      data: { isPublished },
      include: {
        images: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async countImages(propertyId: string, agencyId: string) {
    return prisma.propertyImage.count({
      where: { propertyId, agencyId },
    });
  }

  async addImages(
    propertyId: string,
    agencyId: string,
    imagesData: { url: string; storageKey: string; isPrimary: boolean; sortOrder: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      const createdImages = [];
      for (const img of imagesData) {
        const created = await tx.propertyImage.create({
          data: {
            agencyId,
            propertyId,
            url: img.url,
            storageKey: img.storageKey,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          },
        });
        createdImages.push(created);
      }
      return createdImages;
    });
  }

  async findImageById(imageId: string, propertyId: string, agencyId: string) {
    return prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId, agencyId },
    });
  }

  async setPrimaryImage(imageId: string, propertyId: string, agencyId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.propertyImage.updateMany({
        where: { propertyId, agencyId },
        data: { isPrimary: false },
      });

      return tx.propertyImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }

  async deleteImage(imageId: string, propertyId: string, agencyId: string) {
    return prisma.$transaction(async (tx) => {
      const image = await tx.propertyImage.findFirst({
        where: { id: imageId, propertyId, agencyId },
      });

      if (!image) return null;

      await tx.propertyImage.delete({
        where: { id: imageId },
      });

      // If the deleted image was primary, promote the next image
      if (image.isPrimary) {
        const nextImage = await tx.propertyImage.findFirst({
          where: { propertyId, agencyId },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });

        if (nextImage) {
          await tx.propertyImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }

      return image;
    });
  }
}

export const propertiesRepository = new PropertiesRepository();
