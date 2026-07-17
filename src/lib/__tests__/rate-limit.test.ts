// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist mock functions so they are available inside vi.mock() factory closures.
const mockRedisLimit = vi.hoisted(() => vi.fn());
const mockSlidingWindow = vi.hoisted(() => vi.fn(() => 'sliding-window-config'));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({})),
}));

vi.mock('@upstash/ratelimit', () => {
  const RatelimitMock = vi.fn(() => ({ limit: mockRedisLimit }));
  (RatelimitMock as unknown as { slidingWindow: typeof mockSlidingWindow }).slidingWindow =
    mockSlidingWindow;
  return { Ratelimit: RatelimitMock };
});

// Static import — module loads with NO Redis env vars (hasRedis=false, redis=null).
import { rateLimit } from '../rate-limit';

// ---------------------------------------------------------------------------
// Group 1: no Redis env vars present (default vitest environment)
// ---------------------------------------------------------------------------
describe('rateLimit — no Redis configured', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('allows requests in non-production when UPSTASH env vars are absent', async () => {
    const result = await rateLimit('key:1', 10, 60_000);
    expect(result).toEqual({ success: true, remaining: 10 });
  });

  it('denies requests in production when UPSTASH env vars are absent (fail-closed)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const result = await rateLimit('key:1', 10, 60_000);
    expect(result).toEqual({ success: false, remaining: 0 });
  });
});

// ---------------------------------------------------------------------------
// Group 2: Redis env vars present — re-import module after stubbing env vars
// ---------------------------------------------------------------------------
describe('rateLimit — Redis configured', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fake.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fake-token');
    mockRedisLimit.mockReset();
    mockSlidingWindow.mockClear();
  });

  afterEach(() => vi.unstubAllEnvs());

  async function freshRateLimit() {
    return (await import('../rate-limit')).rateLimit;
  }

  it('returns Redis result when request is under the limit', async () => {
    mockRedisLimit.mockResolvedValue({ success: true, remaining: 7 });
    const rl = await freshRateLimit();
    const result = await rl('user:1', 10, 60_000);
    expect(result).toEqual({ success: true, remaining: 7 });
  });

  it('returns deny result when rate limit is exceeded', async () => {
    mockRedisLimit.mockResolvedValue({ success: false, remaining: 0 });
    const rl = await freshRateLimit();
    const result = await rl('user:1', 10, 60_000);
    expect(result).toEqual({ success: false, remaining: 0 });
  });

  it('allows requests in non-production when Redis throws (fail-open in dev)', async () => {
    mockRedisLimit.mockRejectedValue(new Error('Redis timeout'));
    const rl = await freshRateLimit();
    const result = await rl('key:1', 5, 30_000);
    expect(result).toEqual({ success: true, remaining: 5 });
  });

  it('denies requests in production when Redis throws (fail-closed in prod)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockRedisLimit.mockRejectedValue(new Error('Redis timeout'));
    const rl = await freshRateLimit();
    const result = await rl('key:1', 5, 30_000);
    expect(result).toEqual({ success: false, remaining: 0 });
  });

  it('reuses the same Ratelimit instance for identical limit+window config', async () => {
    mockRedisLimit.mockResolvedValue({ success: true, remaining: 9 });
    const rl = await freshRateLimit();
    const { Ratelimit } = await import('@upstash/ratelimit');
    vi.mocked(Ratelimit).mockClear();
    await rl('user:a', 10, 60_000);
    await rl('user:b', 10, 60_000);
    // Same limit:window key — should create the limiter only once
    expect(vi.mocked(Ratelimit)).toHaveBeenCalledTimes(1);
  });

  it('creates separate Ratelimit instances for different window configs', async () => {
    mockRedisLimit.mockResolvedValue({ success: true, remaining: 3 });
    const rl = await freshRateLimit();
    const { Ratelimit } = await import('@upstash/ratelimit');
    vi.mocked(Ratelimit).mockClear();
    await rl('user:a', 10, 60_000);
    await rl('user:a', 10, 30_000); // different windowMs
    expect(vi.mocked(Ratelimit)).toHaveBeenCalledTimes(2);
  });
});
