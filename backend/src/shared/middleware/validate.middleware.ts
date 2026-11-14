import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { ApiError } from '../errors/ApiError';

export const validate = (schema: ZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query as Request["query"];
      if (parsed.params !== undefined) req.params = parsed.params as Request["params"];
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          ApiError.badRequest(
            'Validation failed',
            error.issues.map((e) => ({
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
