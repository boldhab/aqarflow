import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error(`Critical error: ${err.message}`, err.stack);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  logger.error(`Unhandled error: ${err.message}`, err.stack);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
