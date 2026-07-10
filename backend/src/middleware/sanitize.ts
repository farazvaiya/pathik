import { Request, Response, NextFunction } from 'express';
import { sanitize as mongoSanitize } from 'express-mongo-sanitize';

function scrubDeep(value: any): any {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = scrubDeep(value[i]);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (typeof key === 'string' && (key.startsWith('$') || key.includes('.'))) {
        delete value[key];
      } else if (value[key] && typeof value[key] === 'object') {
        value[key] = scrubDeep(value[key]);
      }
    }
  }
  return value;
}

export function sanitize(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = mongoSanitize(req.body, { replaceWith: '_' });
    }
    if (req.query && typeof req.query === 'object') scrubDeep(req.query);
    if (req.params && typeof req.params === 'object') scrubDeep(req.params);
  } catch {
    // degrade to no-op
  }
  next();
}
