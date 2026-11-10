import { Response, NextFunction } from 'express';
import { visitsService, VisitsService } from './visits.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class VisitsController {
  constructor(private service: VisitsService = visitsService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await this.service.listVisits(req.user.agencyId, req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const visit = await this.service.getVisit(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, data: visit });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const visit = await this.service.createVisit(req.user.agencyId, req.body);
      return res.status(201).json({ success: true, data: visit });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const visit = await this.service.updateVisit(req.params.id, req.user.agencyId, req.body);
      return res.status(200).json({ success: true, data: visit });
    } catch (error) {
      return next(error);
    }
  };
}

export const visitsController = new VisitsController();
