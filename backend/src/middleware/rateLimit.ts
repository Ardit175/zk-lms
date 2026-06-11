import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Dependency-free and good enough to blunt credential brute-force on the auth
 * endpoints. State is per-process, which matches the single-instance deploy; if
 * the backend is ever scaled horizontally this should move to a Redis-backed
 * store so the window is shared across instances.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function rateLimit({ windowMs, max, message }: RateLimitOptions) {
  // Disabled under test so the integration suite can hammer auth endpoints.
  if (process.env.NODE_ENV === 'test') {
    return (_req: Request, _res: Response, next: NextFunction): void => next();
  }

  const buckets = new Map<string, Bucket>();

  // Periodically drop expired buckets so the map can't grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs);
  // Don't keep the event loop alive just for the sweeper.
  if (typeof sweep.unref === 'function') sweep.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res
        .status(429)
        .json(ApiResponse.error(message || 'Too many requests. Please try again later.'));
      return;
    }

    next();
  };
}
