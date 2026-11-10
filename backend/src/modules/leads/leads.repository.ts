import prisma from '@/config/db';
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from './leads.schema';
import { LeadStage } from '@prisma/client';

export class LeadsRepository {
  async findById(id: string, agencyId: string) {
    return prisma.lead.findFirst({
      where: { id, agencyId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        notes: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        visits: true,
        deals: true,
      },
    });
  }

  async findAll(agencyId: string, query: ListLeadsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      agencyId,
      ...(query.stage ? { stage: query.stage as LeadStage } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { notes: true, visits: true } },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(agencyId: string, data: CreateLeadInput) {
    return prisma.lead.create({
      data: {
        agencyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        stage: data.stage,
        source: data.source,
        assignedToId: data.assignedToId,
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, agencyId: string, data: UpdateLeadInput) {
    return prisma.lead.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.stage ? { stage: data.stage } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async assign(id: string, agencyId: string, assignedToId: string) {
    return prisma.lead.update({
      where: { id },
      data: { assignedToId },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async addNote(id: string, agencyId: string, authorId: string | undefined, content: string) {
    return prisma.leadNote.create({
      data: {
        agencyId,
        leadId: id,
        authorId,
        content,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}

export const leadsRepository = new LeadsRepository();
