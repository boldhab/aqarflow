import { leadsRepository, LeadsRepository } from './leads.repository';
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from './leads.schema';
import { ApiError } from '@/shared/errors';

export interface UserContext {
  userId: string;
  agencyId: string;
  role: string;
}

export class LeadsService {
  constructor(private repo: LeadsRepository = leadsRepository) {}

  async listLeads(user: UserContext, query: ListLeadsQuery) {
    const scopedAgentId = user.role === 'AGENT' ? user.userId : undefined;
    return this.repo.findAll(user.agencyId, query, scopedAgentId);
  }

  async getLead(id: string, user: UserContext) {
    const scopedAgentId = user.role === 'AGENT' ? user.userId : undefined;
    const lead = await this.repo.findById(id, user.agencyId, scopedAgentId);
    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }
    return lead;
  }

  async createLead(user: UserContext, input: CreateLeadInput) {
    const assignedAgentId = user.role === 'AGENT' ? user.userId : input.assignedAgentId || input.assignedToId;
    return this.repo.create(user.agencyId, {
      ...input,
      assignedAgentId,
    });
  }

  async updateLead(id: string, user: UserContext, input: UpdateLeadInput) {
    await this.getLead(id, user);
    return this.repo.update(id, user.agencyId, input);
  }

  async assignLead(id: string, user: UserContext, assignedAgentId: string) {
    await this.getLead(id, user);
    return this.repo.assign(id, user.agencyId, assignedAgentId);
  }

  async addNote(id: string, user: UserContext, authorId: string | undefined, content: string) {
    await this.getLead(id, user);
    return this.repo.addNote(id, user.agencyId, authorId, content);
  }
}

export const leadsService = new LeadsService();
