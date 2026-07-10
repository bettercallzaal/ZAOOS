import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchIcmBrain, _resetIcmCache } from '../memory';

const NOW = Date.parse('2026-07-10T12:00:00Z');

beforeEach(() => {
  _resetIcmCache();
  vi.restoreAllMocks();
});

describe('fetchIcmBrain', () => {
  it('returns the llm.txt body on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('# The ZAO\nImpact network.', { status: 200 }),
    );
    const brain = await fetchIcmBrain('icm_abc', NOW);
    expect(brain).toContain('Impact network.');
  });

  it('returns null on a non-200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    expect(await fetchIcmBrain('icm_missing', NOW)).toBeNull();
  });

  it('returns null (never throws) on a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(await fetchIcmBrain('icm_x', NOW)).toBeNull();
  });

  it('serves from cache within the TTL (one fetch for two calls)', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('cached body', { status: 200 }));
    await fetchIcmBrain('icm_c', NOW);
    await fetchIcmBrain('icm_c', NOW + 60_000);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
