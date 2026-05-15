import Redis from 'ioredis';
import { config } from '../config';

/**
 * Lightweight Redis cache helper.
 *
 * Designed to fail open: if Redis is unavailable, every helper becomes a
 * no-op and callers transparently fall through to the database. The app
 * never crashes because of a cache problem.
 */

let redis: Redis | null = null;
let redisHealthy = false;

// Tests run against a shared DB and rely on afterEach cleanup. A persistent
// Redis cache would leak state between tests, so we disable caching entirely
// in the test environment.
const cacheDisabled = process.env.NODE_ENV === 'test';

if (!cacheDisabled) {
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 300, 2000)),
    });

    redis.on('ready', () => {
      redisHealthy = true;
    });
    redis.on('error', () => {
      redisHealthy = false;
    });
    redis.on('end', () => {
      redisHealthy = false;
    });
  } catch {
    redis = null;
    console.warn('[cache] Could not initialize Redis — caching disabled');
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || !redisHealthy) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!redis || !redisHealthy) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
}

/**
 * Delete keys. Patterns containing `*` are expanded via KEYS (fine at this
 * scale); plain keys are deleted directly.
 */
export async function cacheInvalidate(...patterns: string[]): Promise<void> {
  if (!redis || !redisHealthy) return;
  try {
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length) await redis.del(...keys);
      } else {
        await redis.del(pattern);
      }
    }
  } catch {
    /* ignore cache invalidation failures */
  }
}

/** Drop every cache entry that can be affected by a course change. */
export async function invalidateCourseCaches(): Promise<void> {
  await cacheInvalidate('courses:list:*', 'course:slug:*', 'admin:stats');
}

export const TTL = {
  COURSES_LIST: 5 * 60, // 5 minutes
  COURSE_DETAIL: 10 * 60, // 10 minutes
  ADMIN_STATS: 60 * 60, // 1 hour
} as const;

export const cacheKeys = {
  coursesList: (query: Record<string, unknown>) =>
    `courses:list:${JSON.stringify(query)}`,
  courseBySlug: (slug: string) => `course:slug:${slug}`,
  adminStats: 'admin:stats',
};
