import { leadsRepository, LeadsRepository } from './leads.repository';
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from './leads.schema';
import { ApiError } from '@/shared/errors';

export class LeadsService {
  constructor(private repo: LeadsRepository = leadsRepository) {}

  async listLeads(agencyId: string, query: ListLeadsQuery) {
    return this.repo.findAll(agencyId, query);
  }

  async getLead(id: string, agencyId: string) {
    const lead = await this.repo.findById(id, agencyId);
    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }
    return lead;
  }

  async createLead(agencyId: string, input: CreateLeadInput) {
    return this.repo.create(agencyId, input);
  }

  async updateLead(id: string, agencyId: string, input: UpdateLeadInput) {
    await this.getLead(id, agencyId);
    return this.repo.update(id, agencyId, input);
  }

  async assignLead(id: string, agencyId: string, assignedToId: string) {
    await this.getLead(id, agencyId);
    return this.repo.assign(id, agencyId, assignedToId);
  }

  async addNote(id: string, agencyId: string, authorId: string | undefined, content: string) {
    await this.getLead(id, agencyId);
    return this.repo.addNote(id, agencyId, authorId, content);
  }
}

export const leadsService = new LeadsService();
