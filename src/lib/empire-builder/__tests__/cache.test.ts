// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TTL_MS, withCache } from '../cache';
import { EMPIRE_BUILDER_CACHE_TTL_MS } from '../config';

// Each test uses a unique key to avoid cross-test cache interference.

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('withCache', () => {
  it('calls the fetcher on a cache miss', async () => {
    vi.setSystemTime(0);
    const fetcher = vi.fn().mockResolvedValue('data-a');
    const result = await withCache('key-miss-1', 1000, fetcher);
    expect(result).toBe('data-a');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns the fetcher value', async () => {
    vi.setSystemTime(0);
    const obj = { value: 42 };
    const fetcher = vi.fn().mockResolvedValue(obj);
    const result = await withCache('key-val-2', 1000, fetcher);
    expect(result).toBe(obj);
  });

  it('returns cached value on second call within TTL (fetcher called only once)', async () => {
    vi.setSystemTime(0);
    const fetcher = vi.fn().mockResolvedValue('cached-v');
    await withCache('key-hit-3', 5000, fetcher);
    vi.setSystemTime(1000); // still within 5000ms TTL
    const result = await withCache('key-hit-3', 5000, fetcher);
    expect(result).toBe('cached-v');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('calls fetcher again after TTL expires', async () => {
    vi.setSystemTime(0);
    const fetcher = vi.fn().mockResolvedValue('fresh');
    await withCache('key-ttl-4', 500, fetcher);
    vi.setSystemTime(600); // 600ms > 500ms TTL
    await withCache('key-ttl-4', 500, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not re-call fetcher when exactly at TTL boundary (expiresAt > now, not >=)', async () => {
    vi.setSystemTime(0);
    const fetcher = vi.fn().mockResolvedValue('boundary');
    await withCache('key-boundary-5', 500, fetcher);
    vi.setSystemTime(500); // at exactly expiresAt; condition is expiresAt > now → 500 > 500 is false
    await withCache('key-boundary-5', 500, fetcher);
    // expiresAt = 0 + 500 = 500, now = 500, 500 > 500 is false → cache miss → fetcher called again
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('different keys are cached independently', async () => {
    vi.setSystemTime(0);
    const fetcherA = vi.fn().mockResolvedValue('A');
    const fetcherB = vi.fn().mockResolvedValue('B');
    const a = await withCache('key-sep-a-6', 1000, fetcherA);
    const b = await withCache('key-sep-b-6', 1000, fetcherB);
    expect(a).toBe('A');
    expect(b).toBe('B');
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);
  });

  it('uses cached result from prior key even after new key is cached', async () => {
    vi.setSystemTime(0);
    const fetcherX = vi.fn().mockResolvedValue('X');
    await withCache('key-prior-x-7', 2000, fetcherX);
    await withCache('key-new-y-7', 2000, vi.fn().mockResolvedValue('Y'));
    vi.setSystemTime(1000); // still in TTL for x
    const resultX = await withCache('key-prior-x-7', 2000, fetcherX);
    expect(resultX).toBe('X');
    expect(fetcherX).toHaveBeenCalledTimes(1); // still cached
  });
});

describe('DEFAULT_TTL_MS', () => {
  it('equals EMPIRE_BUILDER_CACHE_TTL_MS (60_000 ms)', () => {
    expect(DEFAULT_TTL_MS).toBe(60_000);
    expect(DEFAULT_TTL_MS).toBe(EMPIRE_BUILDER_CACHE_TTL_MS);
  });
});
