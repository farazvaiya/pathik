import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: { _id: string; email: string; role: 'user' | 'admin' };
      deviceId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Anonymous mode: allow requests with deviceId cookie/header
  if (env.ANONYMOUS_MODE === '1') {
    const deviceId =
      req.cookies?.pathik_device ||
      (req.headers['x-device-id'] as string) ||
      (req.body?.deviceId as string);
    if (deviceId) {
      req.deviceId = deviceId;
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  try {
    const payload = verifyAccess(authHeader.slice(7));
    req.user = { _id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccess(authHeader.slice(7));
      req.user = { _id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      // ignore — optional
    }
  }
  const deviceId =
    req.cookies?.pathik_device ||
    (req.headers['x-device-id'] as string) ||
    (req.body?.deviceId as string);
  if (deviceId) req.deviceId = deviceId;
  next();
}
