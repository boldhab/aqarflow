import { Response, NextFunction } from 'express';
import { usersService, UsersService } from './users.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const role = typeof req.query.role === 'string' ? req.query.role : undefined;
      const users = await this.service.getAgencyUsers(req.user.agencyId, role);
      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const user = await this.service.getUserById(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const user = await this.service.createUser(req.user.agencyId, req.body);
      return res.status(201).json({ success: true, data: user });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const user = await this.service.updateUser(req.params.id, req.user.agencyId, req.body);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return next(error);
    }
  };
}

export const usersController = new UsersController();
