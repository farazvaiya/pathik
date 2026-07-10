import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../../utils/jwt';
import { User } from '../../models/User';
import { AppError } from '../../middleware/errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: { _id: string; email: string; role: 'user' | 'admin' | 'police' | 'rab'; displayName?: string };
      deviceId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  try {
    const payload = verifyAccess(authHeader.slice(7));
    const user = await User.findById(payload.sub).select('isDeleted displayName');
    if (!user || user.isDeleted) {
      res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }
    req.user = { _id: payload.sub, email: payload.email, role: payload.role, displayName: user.displayName };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
  }
}

export function roleGuard(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

export function requirePhoneVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }
  // Phone verification check will be done asynchronously
  User.findById(req.user._id).select('isPhoneVerified').then(user => {
    if (!user || !user.isPhoneVerified) {
      return next(new AppError(403, 'PHONE_NOT_VERIFIED', 'Phone verification required for this action'));
    }
    next();
  }).catch(() => {
    next(new AppError(500, 'INTERNAL_ERROR', 'Failed to verify phone status'));
  });
}

export function requireTrustScore(minScore: number) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    try {
      const user = await User.findById(req.user._id).select('trustScore');
      if (!user || user.trustScore < minScore) {
        return next(new AppError(403, 'INSUFFICIENT_TRUST', `Minimum trust score of ${minScore} required`));
      }
      next();
    } catch {
      next(new AppError(500, 'INTERNAL_ERROR', 'Failed to verify trust score'));
    }
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccess(authHeader.slice(7));
      const user = await User.findById(payload.sub).select('isDeleted displayName');
      if (user && !user.isDeleted) {
        req.user = { _id: payload.sub, email: payload.email, role: payload.role, displayName: user.displayName };
      }
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
