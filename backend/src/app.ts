import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { env } from '@/config/env';
import { swaggerSpec } from '@/config/swagger';
import { errorMiddleware } from '@/shared/middleware';
import { apiRouter } from './routes';

export const createApp = (): Application => {
  const app = express();

  // Trust reverse proxy (Render, AWS, Heroku) for secure cookies and accurate client IP
  app.set('trust proxy', 1);

  app.use(helmet());

  const allowedOrigins = (env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server, curl)
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (
          allowedOrigins.includes(cleanOrigin) ||
          allowedOrigins.includes('*') ||
          (env.NODE_ENV !== 'production' && cleanOrigin.includes('localhost')) ||
          cleanOrigin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory with safe headers
  app.use(
    '/uploads',
    (_req: Request, res: Response, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
    express.static(path.resolve(process.cwd(), 'uploads'))
  );

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Mount API modules under /api/v1
  app.use('/api/v1', apiRouter);

  // Central Error Handler
  app.use(errorMiddleware);

  return app;
};

export const app = createApp();
export default app;
