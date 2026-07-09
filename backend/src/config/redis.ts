import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: any = null;

export async function connectRedis(): Promise<boolean> {
  if (!env.REDIS_URL) {
    logger.info('[Redis] No REDIS_URL set — running without Redis cache');
    return false;
  }
  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on('error', (err: any) => logger.warn(`[Redis] Error: ${err.message}`));
    await redisClient.connect();
    logger.info('[Redis] Connected');
    return true;
  } catch (err: any) {
    logger.warn(`[Redis] Connection failed: ${err.message}`);
    return false;
  }
}

export function getRedis(): any {
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('[Redis] Disconnected');
  }
}
