// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config', () => ({
  EMPIRE_BUILDER_CACHE_TTL_MS: 5_000,
}));

import { DEFAULT_TTL_MS, withCache } from '../cache';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('DEFAULT_TTL_MS', () => {
  it('is exported from config (5000ms in test env)', () => {
    expect(DEFAULT_TTL_MS).toBe(5_000);
  });
});

describe('withCache', () => {
  it('calls the fetcher on a cache miss', async () => {
    const fetcher = vi.fn().mockResolvedValue('fresh-value');
    const result = await withCache('key-miss-a', 1_000, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(result).toBe('fresh-value');
  });

  it('returns cached value on a cache hit without calling fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue('cached-value');
    await withCache('key-hit-b', 30_000, fetcher);
    const result = await withCache('key-hit-b', 30_000, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(result).toBe('cached-value');
  });

  it('re-fetches after TTL expires', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await withCache('key-ttl-c', 1_000, fetcher);
    vi.advanceTimersByTime(1_001); // expire the cache
    const result = await withCache('key-ttl-c', 1_000, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result).toBe('second');
  });

  it('different keys are cached independently', async () => {
    const fetcherX = vi.fn().mockResolvedValue('x');
    const fetcherY = vi.fn().mockResolvedValue('y');
    const [rx, ry] = await Promise.all([
      withCache('key-ind-x', 10_000, fetcherX),
      withCache('key-ind-y', 10_000, fetcherY),
    ]);
    expect(rx).toBe('x');
    expect(ry).toBe('y');
    expect(fetcherX).toHaveBeenCalledOnce();
    expect(fetcherY).toHaveBeenCalledOnce();
  });
});
