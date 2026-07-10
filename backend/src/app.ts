import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { sanitize } from './middleware/sanitize';
import { transitRouter } from './modules/transit/transit.routes';
import { communityRouter } from './modules/community/community.routes';
import { feedRouter } from './modules/feed/feed.routes';
import { authRouter } from './modules/auth/auth.routes';
import { emergencyRouter } from './modules/emergency/emergency.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { isDBConnected } from './config/db';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));

const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'] }));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitize);

if (env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));
app.get('/ready', (_req, res) => {
  if (isDBConnected()) res.status(200).json({ status: 'ready', db: 'connected' });
  else res.status(503).json({ status: 'not ready', db: 'disconnected' });
});

const globalLimiter = rateLimit({
  windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
});
app.use('/api', globalLimiter);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/transit', transitRouter);
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/feed', feedRouter);
app.use('/api/v1/emergency', emergencyRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/notifications', notificationsRouter);

const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));
app.get('/{*splat}', (_req, res, next) => {
  if (_req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

export { app };
