import { Response, NextFunction } from 'express';
import { leadsService, LeadsService } from './leads.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class LeadsController {
  constructor(private service: LeadsService = leadsService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await this.service.listLeads(req.user.agencyId, req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.getLead(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.createLead(req.user.agencyId, req.body);
      return res.status(201).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.updateLead(req.params.id, req.user.agencyId, req.body);
      return res.status(200).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  assign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.assignLead(req.params.id, req.user.agencyId, req.body.assignedToId);
      return res.status(200).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  addNote = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const note = await this.service.addNote(
        req.params.id,
        req.user.agencyId,
        req.user.userId,
        req.body.content
      );
      return res.status(201).json({ success: true, data: note });
    } catch (error) {
      return next(error);
    }
  };
}

export const leadsController = new LeadsController();
