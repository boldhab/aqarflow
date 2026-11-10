import { Response, NextFunction } from 'express';
import { propertiesService, PropertiesService } from './properties.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class PropertiesController {
  constructor(private service: PropertiesService = propertiesService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await this.service.listProperties(req.user.agencyId, req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.getProperty(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.createProperty(req.user.agencyId, req.user.userId, req.body);
      return res.status(201).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.updateProperty(req.params.id, req.user.agencyId, req.body);
      return res.status(200).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await this.service.deleteProperty(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
      return next(error);
    }
  };
}

export const propertiesController = new PropertiesController();
