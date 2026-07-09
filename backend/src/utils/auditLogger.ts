import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import { logger } from './logger';

interface AuditOptions {
  action: string;
  req?: Request;
  actorId?: string;
  actorEmail?: string;
  meta?: Record<string, unknown>;
}

export async function auditLog(options: AuditOptions): Promise<void> {
  try {
    const { action, req, actorId, actorEmail, meta } = options;
    await AuditLog.create({
      action,
      actorId: actorId || req?.user?._id || 'anonymous',
      actorEmail: actorEmail || req?.user?.email || '',
      ip: (req?.headers?.['x-forwarded-for'] as string) || req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
      meta: meta || {},
      ts: new Date(),
    });
  } catch (err: any) {
    logger.warn(`[audit] Failed to write audit log: ${err.message}`);
  }
}
