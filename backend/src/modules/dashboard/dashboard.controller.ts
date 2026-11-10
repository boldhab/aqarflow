import { Response, NextFunction } from 'express';
import { dashboardService, DashboardService } from './dashboard.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class DashboardController {
  constructor(private service: DashboardService = dashboardService) {}

  getOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const overview = await this.service.getOverview(req.user.agencyId);
      return res.status(200).json({ success: true, data: overview });
    } catch (error) {
      return next(error);
    }
  };
}

export const dashboardController = new DashboardController();
