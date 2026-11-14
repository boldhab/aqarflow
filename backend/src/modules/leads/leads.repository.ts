import prisma from '@/config/db';
import { transaction } from '@/modules/operations/transaction';
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from './leads.schema';
import { LeadStage } from '@prisma/client';

export class LeadsRepository {
  async findById(id: string, agencyId: string, assignedAgentId?: string) {
    const where: any = { id, agencyId };
    if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId;
    }

    return prisma.lead.findFirst({
      where,
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
        property: {
          select: {
            id: true,
            title: true,
            referenceCode: true,
            price: true,
            currency: true,
            purpose: true,
            type: true,
            city: true,
          },
        },
        notes: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        visits: true,
        deals: true,
      },
    });
  }

  async findAll(agencyId: string, query: ListLeadsQuery, scopedAgentId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      agencyId,
      ...(query.stage ? { stage: query.stage as LeadStage } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    };

    if (scopedAgentId) {
      where.assignedAgentId = scopedAgentId;
    } else if (query.assignedAgentId || query.assignedToId) {
      where.assignedAgentId = query.assignedAgentId || query.assignedToId;
    }

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedAgent: { select: { id: true, name: true, email: true } },
          property: {
            select: {
              id: true,
              title: true,
              referenceCode: true,
              price: true,
              currency: true,
              city: true,
            },
          },
          _count: { select: { notes: true, visits: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
    const agentId = data.assignedAgentId || data.assignedToId || null;
    return prisma.lead.create({
      data: {
        agencyId,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        stage: data.stage,
        source: data.source,
        propertyId: data.propertyId || null,
        assignedAgentId: agentId,
        message: data.message || null,
        preferredContact: data.preferredContact,
      },
      include: {
        assignedAgent: { select: { id: true, name: true } },
        property: { select: { id: true, title: true, referenceCode: true } },
      },
    });
  }

  async update(id: string, agencyId: string, data: UpdateLeadInput) {
    const agentId = data.assignedAgentId !== undefined ? data.assignedAgentId : data.assignedToId;
    return prisma.lead.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.stage ? { stage: data.stage } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.propertyId !== undefined ? { propertyId: data.propertyId } : {}),
        ...(agentId !== undefined ? { assignedAgentId: agentId } : {}),
        ...(data.message !== undefined ? { message: data.message } : {}),
        ...(data.preferredContact ? { preferredContact: data.preferredContact } : {}),
      },
      include: {
        assignedAgent: { select: { id: true, name: true } },
        property: { select: { id: true, title: true, referenceCode: true } },
      },
    });
  }

  async assign(id: string, agencyId: string, assignedAgentId: string) {
    return transaction(async tx=>{
    const lead=await tx.lead.update({
      where: { id },
      data: { assignedAgentId },
      include: {
        assignedAgent: { select: { id: true, name: true } },
        property: { select: { id: true, title: true, referenceCode: true } },
      },
    });
    await tx.notification.create({data:{agencyId,userId:assignedAgentId,title:'Lead assigned',body:`${lead.name} was assigned to you`,linkUrl:'/leads'}});
    const agent=await tx.user.findUniqueOrThrow({where:{id:assignedAgentId}});
    await tx.emailJob.create({data:{agencyId,recipient:agent.email,subject:'New lead assigned',body:`${lead.name} has been assigned to you. Open the workspace to follow up.`}});
    return lead;
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
