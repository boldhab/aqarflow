import { Response, NextFunction } from 'express';
import { dealsService, DealsService } from './deals.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class DealsController {
  constructor(private service: DealsService = dealsService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await this.service.listDeals(req.user.agencyId, req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const deal = await this.service.getDeal(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, data: deal });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const deal = await this.service.createDeal(req.user.agencyId, req.body);
      return res.status(201).json({ success: true, data: deal });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const deal = await this.service.updateDeal(req.params.id, req.user.agencyId, req.body);
      return res.status(200).json({ success: true, data: deal });
    } catch (error) {
      return next(error);
    }
  };
}

export const dealsController = new DealsController();
