import prisma from '@/config/db';
import { CreateVisitInput, UpdateVisitInput, ListVisitsQuery } from './visits.schema';
import { VisitStatus } from '@prisma/client';

export class VisitsRepository {
  async findById(id: string, agencyId: string) {
    return prisma.visit.findFirst({
      where: { id, agencyId },
      include: {
        property: { select: { id: true, title: true, address: true, city: true } },
        lead: { select: { id: true, name: true, phone: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(agencyId: string, query: ListVisitsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      agencyId,
      ...(query.status ? { status: query.status as VisitStatus } : {}),
      ...(query.agentId ? { agentId: query.agentId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          property: { select: { id: true, title: true } },
          lead: { select: { id: true, name: true, phone: true } },
          agent: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.visit.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(agencyId: string, data: CreateVisitInput) {
    return prisma.visit.create({
      data: {
        agencyId,
        propertyId: data.propertyId,
        leadId: data.leadId,
        agentId: data.agentId,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes,
      },
      include: {
        property: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, agencyId: string, data: UpdateVisitInput) {
    return prisma.visit.update({
      where: { id },
      data: {
        ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
        ...(data.status ? { status: data.status as VisitStatus } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.agentId !== undefined ? { agentId: data.agentId } : {}),
      },
      include: {
        property: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true } },
      },
    });
  }
}

export const visitsRepository = new VisitsRepository();
