import winston from 'winston';
import { env } from '../config/env';

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
        })
  ),
  transports: [new winston.transports.Console({ stderrLevels: ['error'] })],
});

export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'jwt'];
  const redacted = { ...obj };
  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]';
    }
  }
  return redacted;
}

export { logger };
