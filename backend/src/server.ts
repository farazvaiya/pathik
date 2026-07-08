import { app } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

async function start() {
  const connected = await connectDB();
  if (connected) {
    logger.info('MongoDB connected successfully');
  } else {
    logger.warn('Starting without MongoDB — DB-backed features (auth, community) disabled');
  }

  app.listen(env.PORT, () => {
    logger.info(`Pathik server running at http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
