import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../errors/ApiError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          ApiError.badRequest(
            'Validation failed',
            error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          )
        );
      }
      return next(error);
    }
  };
};
