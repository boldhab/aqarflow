import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../errors/ApiError';
import prisma from '@/config/db';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // 1. Read token from httpOnly cookie 'aqarflow_token'
  if (req.cookies && typeof req.cookies.aqarflow_token === 'string') {
    token = req.cookies.aqarflow_token;
  }
  // 2. Fallback to Authorization: Bearer <token> (convenient for testing & API clients)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  try {
    const payload = verifyToken(token);

    // 3. Load user from database to ensure user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        agencyId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return next(ApiError.unauthorized('User not found'));
    }

    if (!user.isActive) {
      return next(ApiError.unauthorized('Account is deactivated'));
    }

    req.user = {
      id: user.id,
      userId: user.id,
      agencyId: user.agencyId,
      role: user.role,
    };

    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};
