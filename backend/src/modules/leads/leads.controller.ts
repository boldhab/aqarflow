import { Response, NextFunction } from 'express';
import { leadsService, LeadsService } from './leads.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class LeadsController {
  constructor(private service: LeadsService = leadsService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await this.service.listLeads(
        { userId: req.user.userId, agencyId: req.user.agencyId, role: req.user.role },
        req.query as any
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.getLead(req.params.id, {
        userId: req.user.userId,
        agencyId: req.user.agencyId,
        role: req.user.role,
      });
      return res.status(200).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.createLead(
        { userId: req.user.userId, agencyId: req.user.agencyId, role: req.user.role },
        req.body
      );
      return res.status(201).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const lead = await this.service.updateLead(
        req.params.id,
        { userId: req.user.userId, agencyId: req.user.agencyId, role: req.user.role },
        req.body
      );
      return res.status(200).json({ success: true, data: lead });
    } catch (error) {
      return next(error);
    }
  };

  assign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const agentId = req.body.assignedAgentId || req.body.assignedToId;
      const lead = await this.service.assignLead(
        req.params.id,
        { userId: req.user.userId, agencyId: req.user.agencyId, role: req.user.role },
        agentId
      );
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
        { userId: req.user.userId, agencyId: req.user.agencyId, role: req.user.role },
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
