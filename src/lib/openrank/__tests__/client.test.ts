// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChannelRankings, getEngagementScores, getPersonalizedScores } from '../client';

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getEngagementScores
// ---------------------------------------------------------------------------

describe('getEngagementScores', () => {
  it('returns an empty Map for an empty FID list without fetching', async () => {
    const result = await getEngagementScores([]);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map on non-OK response', async () => {
    stubFetch(false, {});
    const result = await getEngagementScores([1, 2, 3]);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map when result is not an array', async () => {
    stubFetch(true, { result: null });
    const result = await getEngagementScores([1, 2]);
    expect(result.size).toBe(0);
  });

  it('returns a Map with scores when response contains valid entries', async () => {
    stubFetch(true, {
      result: [
        { fid: 1, score: 0.95 },
        { fid: 2, score: 0.42 },
        { fid: 999, score: 0.1 },
      ],
    });
    const result = await getEngagementScores([1, 2, 999]);
    expect(result.size).toBe(3);
    expect(result.get(1)).toBeCloseTo(0.95);
    expect(result.get(999)).toBeCloseTo(0.1);
  });

  it('returns an empty Map when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    const result = await getEngagementScores([1]);
    expect(result.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getPersonalizedScores
// ---------------------------------------------------------------------------

describe('getPersonalizedScores', () => {
  it('returns an empty Map for an empty targetFids list without fetching', async () => {
    const result = await getPersonalizedScores(123, []);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map on non-OK response', async () => {
    stubFetch(false, {});
    const result = await getPersonalizedScores(123, [1, 2]);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map when result is not an array', async () => {
    stubFetch(true, { result: 'unexpected' });
    const result = await getPersonalizedScores(123, [1]);
    expect(result.size).toBe(0);
  });

  it('returns a Map with personalized scores for valid entries', async () => {
    stubFetch(true, {
      result: [
        { fid: 5, score: 0.88 },
        { fid: 6, score: 0.12 },
      ],
    });
    const result = await getPersonalizedScores(1, [5, 6]);
    expect(result.size).toBe(2);
    expect(result.get(5)).toBeCloseTo(0.88);
    expect(result.get(6)).toBeCloseTo(0.12);
  });
});

// ---------------------------------------------------------------------------
// getChannelRankings
// ---------------------------------------------------------------------------

describe('getChannelRankings', () => {
  it('returns an empty array on non-OK response', async () => {
    stubFetch(false, {});
    const result = await getChannelRankings('zao');
    expect(result).toEqual([]);
  });

  it('returns an empty array when result is not an array', async () => {
    stubFetch(true, { result: { unexpected: 'object' } });
    const result = await getChannelRankings('zao');
    expect(result).toEqual([]);
  });

  it('returns shaped OpenRankScore objects from valid data', async () => {
    stubFetch(true, {
      result: [
        { fid: 42, fname: 'zaal', username: 'zaal.eth', rank: 1, score: 0.99, percentile: 99.5 },
      ],
    });
    const result = await getChannelRankings('zao');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      fid: 42,
      fname: 'zaal',
      username: 'zaal.eth',
      rank: 1,
      score: 0.99,
      percentile: 99.5,
    });
  });

  it('returns an empty array when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Abort')));
    const result = await getChannelRankings('zao');
    expect(result).toEqual([]);
  });
});
