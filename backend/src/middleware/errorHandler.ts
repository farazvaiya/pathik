import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger, sanitizeForLogging } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  fields?: Record<string, string[]>;

  constructor(statusCode: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    error: err.message,
    stack: err.stack,
    body: req.body ? sanitizeForLogging(req.body) : undefined,
  });

  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields } });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'A resource with that value already exists' } });
    return;
  }

  if (err.name === 'CastError' || err.name === 'BSONError') {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid resource ID format' } });
    return;
  }

  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
