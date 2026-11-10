import { app } from './app';
import { env } from '@/config/env';
import { logger } from '@/shared/utils';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`AqarFlow Backend running on http://localhost:${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/docs`);
  logger.info(`API v1 mounted at http://localhost:${PORT}/api/v1`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});

export default server;
