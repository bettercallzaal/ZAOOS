// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// Provide ENV vars before the module loads — neynar.ts reads ENV at import time.
vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
    FARCASTER_READ_API_BASE: undefined, // READ_BASE === NEYNAR_BASE → simple fetch path
  },
}));

import { getNeynarUserScore, getTrendingFeed, getUsersByFids } from '../neynar';

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getNeynarUserScore — uses direct fetch (not fetchWithFailover)
// ---------------------------------------------------------------------------

describe('getNeynarUserScore', () => {
  it('returns null on a non-OK response', async () => {
    stubFetch(false, {});
    expect(await getNeynarUserScore(1)).toBeNull();
  });

  it('returns null when data.users is absent', async () => {
    stubFetch(true, {});
    expect(await getNeynarUserScore(1)).toBeNull();
  });

  it('returns null when experimental.neynar_user_score is not a number', async () => {
    stubFetch(true, { users: [{ experimental: { neynar_user_score: 'high' } }] });
    expect(await getNeynarUserScore(1)).toBeNull();
  });

  it('returns the numeric score when present', async () => {
    stubFetch(true, { users: [{ experimental: { neynar_user_score: 0.87 } }] });
    expect(await getNeynarUserScore(1)).toBeCloseTo(0.87);
  });

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    expect(await getNeynarUserScore(1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getUsersByFids — uses fetchWithFailover
// ---------------------------------------------------------------------------

describe('getUsersByFids', () => {
  it('returns an empty array immediately for an empty FID list', async () => {
    const result = await getUsersByFids([]);
    expect(result).toEqual([]);
  });

  it('throws with status when the response is non-OK', async () => {
    stubFetch(false, 'Unauthorized');
    await expect(getUsersByFids([1, 2])).rejects.toThrow('Neynar bulk user error 500');
  });

  it('returns data.users on a successful response', async () => {
    stubFetch(true, { users: [{ fid: 1, username: 'alice' }, { fid: 2, username: 'bob' }] });
    const result = await getUsersByFids([1, 2]);
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('alice');
  });
});

// ---------------------------------------------------------------------------
// getTrendingFeed — uses fetchWithFailover
// ---------------------------------------------------------------------------

describe('getTrendingFeed', () => {
  it('throws with status on a non-OK response', async () => {
    stubFetch(false, 'Rate limited');
    await expect(getTrendingFeed()).rejects.toThrow('Neynar trending feed error 500');
  });

  it('returns the parsed JSON on success', async () => {
    const payload = { casts: [{ hash: '0xabc', text: 'gm' }], next: { cursor: 'cursor1' } };
    stubFetch(true, payload);
    const result = await getTrendingFeed(10, '6h');
    expect(result.casts).toHaveLength(1);
    expect(result.next.cursor).toBe('cursor1');
  });

  it('includes cursor in the query string when provided', async () => {
    stubFetch(true, { casts: [] });
    await getTrendingFeed(25, '24h', 'page2token');
    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain('cursor=page2token');
  });
});
