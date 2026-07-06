// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { isRetryableHttpError, withRetry } from '../retry';

const noSleep = async () => {};

describe('withRetry', () => {
  it('returns immediately on first success', async () => {
    const fn = vi.fn(async () => 'ok');
    const result = await withRetry(fn, { sleep: noSleep });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries then succeeds', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls < 3) throw new Error('boom 500');
      return 'recovered';
    });
    const result = await withRetry(fn, { retries: 3, sleep: noSleep });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting retries', async () => {
    const fn = vi.fn(async () => {
      throw new Error('always fails');
    });
    await expect(withRetry(fn, { retries: 2, sleep: noSleep })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // 1 + 2 retries
  });

  it('does not retry when shouldRetry returns false', async () => {
    const fn = vi.fn(async () => {
      throw new Error('permanent 404');
    });
    await expect(
      withRetry(fn, { retries: 5, sleep: noSleep, shouldRetry: () => false }),
    ).rejects.toThrow('permanent 404');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes exponential backoff delays to sleep', async () => {
    const delays: number[] = [];
    const fn = vi.fn(async () => {
      throw new Error('500');
    });
    await expect(
      withRetry(fn, {
        retries: 3,
        baseDelayMs: 100,
        factor: 2,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }),
    ).rejects.toThrow();
    expect(delays).toEqual([100, 200, 400]);
  });
});

describe('isRetryableHttpError', () => {
  it('retries 5xx and 429', () => {
    expect(isRetryableHttpError(new Error('returned HTTP 503'))).toBe(true);
    expect(isRetryableHttpError(new Error('rate limited 429'))).toBe(true);
  });

  it('does not retry 4xx (other than 429)', () => {
    expect(isRetryableHttpError(new Error('returned 404'))).toBe(false);
    expect(isRetryableHttpError(new Error('forbidden 403'))).toBe(false);
  });

  it('retries network errors with no status code', () => {
    expect(isRetryableHttpError(new Error('fetch failed'))).toBe(true);
    expect(isRetryableHttpError(new Error('Request timed out after 10000ms'))).toBe(true);
  });
});
