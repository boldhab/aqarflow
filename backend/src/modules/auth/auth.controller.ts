import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.login(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.register(req.body);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const authController = new AuthController();
