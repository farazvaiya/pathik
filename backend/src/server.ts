import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { initSocketServer } from './sockets/socketServer';

async function start() {
  const connected = await connectDB();
  if (connected) {
    logger.info('MongoDB connected successfully');
  } else {
    logger.warn('Starting without MongoDB — DB-backed features (auth, community) disabled');
  }

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`Pathik server running at http://localhost:${env.PORT}`);
    logger.info(`WebSocket server running on same port`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
