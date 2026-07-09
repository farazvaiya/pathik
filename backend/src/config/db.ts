import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const connectOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 10_000,
  // Prefer IPv4 first — avoids some dual-stack / Atlas TLS handshake flakiness on Linux
  family: 4,
};

export async function connectDB(): Promise<boolean> {
  try {
    await mongoose.connect(env.MONGODB_URI, connectOptions);
    logger.info(`[DB] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (error: any) {
    logger.warn(`[DB] MongoDB unavailable — starting in DB-optional mode. Cause: ${error.message}`);
    return false;
  }
}

export async function connectDBOrExit(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, connectOptions);
    logger.info(`[DB] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
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
