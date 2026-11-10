import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../errors/ApiError';
import { AuthenticatedRequest } from '../types';

export const authMiddleware = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Access token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};
