import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

export function ownershipCheck(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }
  next();
}

export function isOwnerOrAdmin(
  userId: string,
  resourceAuthorId: string | null | undefined,
  userRole: string
): boolean {
  if (userRole === 'admin') return true;
  if (!resourceAuthorId) return true;
  return userId === String(resourceAuthorId);
}
