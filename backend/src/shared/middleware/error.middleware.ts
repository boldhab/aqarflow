import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) return res.status(400).json({success:false,message:err.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')});
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({success:false,message:'A record with these details already exists'});
    if (err.code === 'P2025') return res.status(404).json({success:false,message:'Record not found'});
    if (['P2003','P2004','P2010','P2034'].includes(err.code)) return res.status(409).json({success:false,message:'This change conflicts with an existing record. Refresh and try again.'});
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError && /23P01|no_overlap/.test(err.message)) return res.status(409).json({success:false,message:'This time period overlaps an existing booking'});
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
