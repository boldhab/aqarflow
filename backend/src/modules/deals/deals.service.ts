import { dealsRepository, DealsRepository } from './deals.repository';
import { CreateDealInput, UpdateDealInput, ListDealsQuery } from './deals.schema';
import { ApiError } from '@/shared/errors';

export class DealsService {
  constructor(private repo: DealsRepository = dealsRepository) {}

  async listDeals(agencyId: string, query: ListDealsQuery) {
    return this.repo.findAll(agencyId, query);
  }

  async getDeal(id: string, agencyId: string) {
    const deal = await this.repo.findById(id, agencyId);
    if (!deal) {
      throw ApiError.notFound('Deal not found');
    }
    return deal;
  }

  async createDeal(agencyId: string, input: CreateDealInput) {
    return this.repo.create(agencyId, input);
  }

  async updateDeal(id: string, agencyId: string, input: UpdateDealInput) {
    await this.getDeal(id, agencyId);
    return this.repo.update(id, agencyId, input);
  }
}

export const dealsService = new DealsService();
