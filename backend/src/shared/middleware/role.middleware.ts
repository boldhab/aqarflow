import { Response, NextFunction } from 'express';
import { Role } from '../permissions';
import { ApiError } from '../errors/ApiError';
import { AuthenticatedRequest } from '../types';

export const roleMiddleware = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    return next();
  };
};
