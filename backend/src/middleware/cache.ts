import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(req: Request): string {
  return `${req.method}:${req.originalUrl}`;
}

export function cacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = getCacheKey(req);
    const entry = cache.get(key);

    if (entry && entry.expires > Date.now()) {
      res.json(entry.data);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data: body,
          expires: Date.now() + ttlSeconds * 1000,
        });
      }
      return originalJson(body);
    };

    next();
  };
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expires <= now) {
      cache.delete(key);
    }
  }
}

setInterval(cleanupCache, 60_000);
