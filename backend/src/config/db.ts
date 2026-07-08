import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDB(): Promise<boolean> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
    return true;
  } catch (error: any) {
    logger.warn(`[DB] MongoDB unavailable — starting in DB-optional mode. Cause: ${error.message}`);
    return false;
  }
}

export async function connectDBOrExit(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (error: any) {
    logger.error(`[DB] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
  mongoose.connection.on('error', (err) => logger.error(`[DB] Runtime error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('[DB] MongoDB disconnected'));
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[DB] MongoDB disconnected gracefully');
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
