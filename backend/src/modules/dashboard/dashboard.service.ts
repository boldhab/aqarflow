import { dashboardRepository, DashboardRepository } from './dashboard.repository';
import { DashboardOverviewDTO } from './dashboard.types';

export class DashboardService {
  constructor(private repo: DashboardRepository = dashboardRepository) {}

  async getOverview(agencyId: string): Promise<DashboardOverviewDTO> {
    return this.repo.getAgencyMetrics(agencyId);
  }
}

export const dashboardService = new DashboardService();
