/**
 * A basic fixed-window rate limit, held in memory per server instance.
 *
 * Enough for one long-running server. On serverless each instance counts on its
 * own, so the real limit is this times the number of warm instances. ZAOOS
 * uses Upstash Redis (`src/lib/rate-limit.ts`) for a shared limit; switch to
 * that before running on more than one instance.
 */

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_KEYS = 10_000;

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      if (buckets.size >= MAX_KEYS) {
        for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
        // Still full of live windows: drop the oldest entry rather than grow without bound.
        if (buckets.size >= MAX_KEYS) {
          const oldest = buckets.keys().next().value;
          if (oldest !== undefined) buckets.delete(oldest);
        }
      }
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    return { ok: true, retryAfterSeconds: 0 };
  };
}

/** The client IP as the hosting proxy reports it. Falls back to one shared bucket. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}

const MINUTE = 60 * 1000;
export const limits = {
  nonce: createRateLimiter(20, MINUTE),
  verify: createRateLimiter(10, MINUTE),
  addressWrite: createRateLimiter(10, MINUTE),
};
