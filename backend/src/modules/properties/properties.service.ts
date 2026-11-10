import { propertiesRepository, PropertiesRepository } from './properties.repository';
import { CreatePropertyInput, UpdatePropertyInput, ListPropertiesQuery } from './properties.schema';
import { ApiError } from '@/shared/errors';

export class PropertiesService {
  constructor(private repo: PropertiesRepository = propertiesRepository) {}

  async listProperties(agencyId: string, query: ListPropertiesQuery) {
    return this.repo.findAll(agencyId, query);
  }

  async getProperty(id: string, agencyId: string) {
    const property = await this.repo.findById(id, agencyId);
    if (!property) {
      throw ApiError.notFound('Property not found');
    }
    return property;
  }

  async createProperty(agencyId: string, userId: string, input: CreatePropertyInput) {
    return this.repo.create(agencyId, userId, input);
  }

  async updateProperty(id: string, agencyId: string, input: UpdatePropertyInput) {
    await this.getProperty(id, agencyId);
    return this.repo.update(id, agencyId, input);
  }

  async deleteProperty(id: string, agencyId: string) {
    await this.getProperty(id, agencyId);
    return this.repo.delete(id, agencyId);
  }
}

export const propertiesService = new PropertiesService();
