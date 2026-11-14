import { saveVisit } from '@/modules/operations/core.service';
import { visitsRepository, VisitsRepository } from './visits.repository';
import { CreateVisitInput, UpdateVisitInput, ListVisitsQuery } from './visits.schema';
import { ApiError } from '@/shared/errors';

export class VisitsService {
  constructor(private repo: VisitsRepository = visitsRepository) {}

  async listVisits(agencyId: string, query: ListVisitsQuery) {
    return this.repo.findAll(agencyId, query);
  }

  async getVisit(id: string, agencyId: string) {
    const visit = await this.repo.findById(id, agencyId);
    if (!visit) {
      throw ApiError.notFound('Visit not found');
    }
    return visit;
  }

  async createVisit(agencyId: string, input: CreateVisitInput) {
    return saveVisit(agencyId, input);
  }

  async updateVisit(id: string, agencyId: string, input: UpdateVisitInput) {
    await this.getVisit(id, agencyId);
    return saveVisit(agencyId, input, id);
  }
}

export const visitsService = new VisitsService();
