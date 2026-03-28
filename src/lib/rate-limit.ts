import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redis for rate limiting — works across Vercel serverless invocations.
// If env vars are missing (local dev without Redis), rateLimit() allows all requests.
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Cache Ratelimit instances per window config to avoid re-creating on every request.
const limiters = new Map<string, Ratelimit>();

function getOrCreateLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    const windowSec = Math.ceil(windowMs / 1000);
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: 'rl',
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  try {
    const limiter = getOrCreateLimiter(limit, windowMs);
    if (!limiter) {
      // No Redis configured (local dev) — allow all requests
      return { success: true, remaining: limit };
    }
    const result = await limiter.limit(key);
    return { success: result.success, remaining: result.remaining };
  } catch {
    // If Redis is down, allow the request through rather than blocking users
    return { success: true, remaining: limit };
  }
}
