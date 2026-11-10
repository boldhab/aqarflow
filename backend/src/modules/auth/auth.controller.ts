import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service';
import { env } from '@/config/env';
import { parseDurationToMs } from '@/shared/utils';
import { ApiError } from '@/shared/errors';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, token } = await this.service.login(req.body);

      const maxAge = parseDurationToMs(env.JWT_EXPIRES_IN);

      res.cookie('aqarflow_token', token, {
        httpOnly: true,
        sameSite: env.COOKIE_SAMESITE,
        secure: env.NODE_ENV === 'production',
        path: '/',
        maxAge,
      });

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized('Authentication required');
      }

      const user = await this.service.getMe(req.user.id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie('aqarflow_token', {
        httpOnly: true,
        sameSite: env.COOKIE_SAMESITE,
        secure: env.NODE_ENV === 'production',
        path: '/',
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  adminCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Admin access confirmed',
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, token } = await this.service.register(req.body);

      const maxAge = parseDurationToMs(env.JWT_EXPIRES_IN);

      res.cookie('aqarflow_token', token, {
        httpOnly: true,
        sameSite: env.COOKIE_SAMESITE,
        secure: env.NODE_ENV === 'production',
        path: '/',
        maxAge,
      });

      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
