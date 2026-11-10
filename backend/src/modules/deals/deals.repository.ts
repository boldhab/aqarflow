import prisma from '@/config/db';
import { CreateDealInput, UpdateDealInput, ListDealsQuery } from './deals.schema';
import { DealStatus } from '@prisma/client';

export class DealsRepository {
  async findById(id: string, agencyId: string) {
    return prisma.deal.findFirst({
      where: { id, agencyId },
      include: {
        property: { select: { id: true, title: true, price: true } },
        lead: { select: { id: true, name: true, phone: true } },
        agent: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(agencyId: string, query: ListDealsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      agencyId,
      ...(query.status ? { status: query.status as DealStatus } : {}),
      ...(query.agentId ? { agentId: query.agentId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          property: { select: { id: true, title: true } },
          lead: { select: { id: true, name: true } },
          agent: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(agencyId: string, data: CreateDealInput) {
    return prisma.deal.create({
      data: {
        agencyId,
        propertyId: data.propertyId,
        leadId: data.leadId,
        agentId: data.agentId,
        value: data.value,
        status: data.status,
      },
      include: {
        property: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, agencyId: string, data: UpdateDealInput) {
    return prisma.deal.update({
      where: { id },
      data: {
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.status ? { status: data.status as DealStatus } : {}),
        ...(data.agentId !== undefined ? { agentId: data.agentId } : {}),
        ...(data.closedAt !== undefined
          ? { closedAt: data.closedAt ? new Date(data.closedAt) : null }
          : {}),
      },
      include: {
        property: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true } },
      },
    });
  }
}

export const dealsRepository = new DealsRepository();
