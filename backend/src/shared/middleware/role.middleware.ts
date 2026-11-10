import { Request, Response, NextFunction } from 'express';
import { Role } from '../permissions';
import { ApiError } from '../errors/ApiError';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    return next();
  };
};

export const roleMiddleware = requireRole;
