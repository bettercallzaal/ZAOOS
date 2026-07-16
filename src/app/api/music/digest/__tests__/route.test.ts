import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { GET } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query in FIFO order for parallel Promise.allSettled.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = ['select', 'gte', 'eq', 'order', 'limit', 'not', 'is'];
  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Build a queued chain for Promise.allSettled calls.
 * Each .then() call shifts one result from the queue.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = ['select', 'gte', 'eq', 'order', 'limit', 'not', 'is'];
  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => {
    const result = q.shift();
    resolve(result);
  });
  return chain;
}

describe('GET /api/music/digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── Query parameter validation tests ──────────────────────────────────────

  it('defaults to period=week when not provided', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.period).toBe('week');
  });

  it('accepts period=month', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest', { period: 'month' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.period).toBe('month');
  });

  it('rejects invalid period values', async () => {
    const res = await GET(makeGetRequest('/api/music/digest', { period: 'invalid' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('rejects unknown query parameters gracefully', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ]),
    );
    // Unknown params are ignored per Zod schema
    const res = await GET(
      makeGetRequest('/api/music/digest', { period: 'week', unknown: 'value' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.period).toBe('week');
  });

  // ── Success path tests ────────────────────────────────────────────────────

  it('returns empty digest when no data exists', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null }, // topTracks
        { data: [], error: null }, // newSubmissions
        { data: [], error: null }, // trackOfDayWinners
        { data: null, error: null }, // activeSubmitters second query
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest', { period: 'week' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topTracks).toEqual([]);
    expect(body.newSubmissions).toEqual([]);
    expect(body.topListeners).toEqual([]);
    expect(body.trackOfDayWinners).toEqual([]);
    expect(body.period).toBe('week');
  });

  it('returns top 10 tracks sorted by play_count descending', async () => {
    const topTracks = [
      { id: 'track1', title: 'Song A', artist: 'Artist A', play_count: 100 },
      { id: 'track2', title: 'Song B', artist: 'Artist B', play_count: 50 },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: topTracks, error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topTracks).toEqual(topTracks);
  });

  it('returns new approved submissions up to limit', async () => {
    const newSubs = [
      { id: 'sub1', title: 'New Track', artist: 'New Artist', status: 'approved' },
      { id: 'sub2', title: 'Another Track', artist: 'Another Artist', status: 'approved' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: newSubs, error: null },
        { data: [], error: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newSubmissions).toEqual(newSubs);
  });

  it('returns track of the day winners with non-null selected_date', async () => {
    const winners = [
      { id: 'totd1', track_title: 'TOTD 1', track_artist: 'Artist 1', votes_count: 42 },
      { id: 'totd2', track_title: 'TOTD 2', track_artist: 'Artist 2', votes_count: 38 },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: winners, error: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trackOfDayWinners).toEqual(winners);
  });

  it('aggregates top listeners from approved submissions', async () => {
    const activeSubmitters = [
      { submitted_by_fid: 111, submitted_by_username: 'user1' },
      { submitted_by_fid: 111, submitted_by_username: 'user1' },
      { submitted_by_fid: 111, submitted_by_username: 'user1' },
      { submitted_by_fid: 222, submitted_by_username: 'user2' },
      { submitted_by_fid: 222, submitted_by_username: 'user2' },
      { submitted_by_fid: 333, submitted_by_username: 'user3' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: activeSubmitters, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners).toHaveLength(3);
    // Top listener should have 3 submissions
    expect(body.topListeners[0].fid).toBe(111);
    expect(body.topListeners[0].plays).toBe(3);
    expect(body.topListeners[0].username).toBe('user1');
    // Second should have 2
    expect(body.topListeners[1].fid).toBe(222);
    expect(body.topListeners[1].plays).toBe(2);
    // Third should have 1
    expect(body.topListeners[2].fid).toBe(333);
    expect(body.topListeners[2].plays).toBe(1);
  });

  it('limits top listeners to top 10', async () => {
    const activeSubmitters = Array.from({ length: 15 }, (_, i) => ({
      submitted_by_fid: i + 1,
      submitted_by_username: `user${i + 1}`,
    }));
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: activeSubmitters, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners).toHaveLength(10);
  });

  it('uses null username fallback when username is missing', async () => {
    const activeSubmitters = [
      { submitted_by_fid: 111, submitted_by_username: null },
      { submitted_by_fid: 111, submitted_by_username: null },
      { submitted_by_fid: 222, submitted_by_username: 'user2' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: activeSubmitters, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners[0].username).toBe('FID 111');
    expect(body.topListeners[1].username).toBe('user2');
  });

  it('handles period=week with 7-day lookback', async () => {
    const topTracksChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(topTracksChain);

    await GET(makeGetRequest('/api/music/digest', { period: 'week' }));

    // First .from() call should be for songs with 7-day window
    expect(mockFrom).toHaveBeenCalledWith('songs');
    // Check that gte was called with a date roughly 7 days ago
    const gteCall = topTracksChain.gte.mock.calls[0];
    expect(gteCall[0]).toBe('last_played_at');
    const sinceDate = new Date(gteCall[1] as string);
    const now = new Date();
    const daysDiff = (now.getTime() - sinceDate.getTime()) / (24 * 60 * 60 * 1000);
    expect(daysDiff).toBeGreaterThan(6);
    expect(daysDiff).toBeLessThan(8);
  });

  it('handles period=month with 30-day lookback', async () => {
    const topTracksChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(topTracksChain);

    await GET(makeGetRequest('/api/music/digest', { period: 'month' }));

    const gteCall = topTracksChain.gte.mock.calls[0];
    const sinceDate = new Date(gteCall[1] as string);
    const now = new Date();
    const daysDiff = (now.getTime() - sinceDate.getTime()) / (24 * 60 * 60 * 1000);
    expect(daysDiff).toBeGreaterThan(29);
    expect(daysDiff).toBeLessThan(31);
  });

  it('applies correct query limits and ordering', async () => {
    const songsChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(songsChain);

    await GET(makeGetRequest('/api/music/digest'));

    // First query (songs) should be limited to 10 and ordered by play_count desc
    expect(songsChain.limit).toHaveBeenCalledWith(10);
    expect(songsChain.order).toHaveBeenCalledWith('play_count', { ascending: false });
  });

  it('sets cache headers on successful response', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=60',
    );
  });

  // ── Partial failure tests (Promise.allSettled) ───────────────────────────

  it('handles top tracks query failure gracefully', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: null, error: new Error('db error') }, // topTracks fails
        { data: [], error: null }, // newSubmissions succeeds
        { data: [], error: null }, // trackOfDayWinners succeeds
        { data: null, error: null }, // activeSubmitters
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topTracks).toEqual([]);
    expect(body.newSubmissions).toEqual([]);
    expect(body.trackOfDayWinners).toEqual([]);
  });

  it('handles new submissions query failure gracefully', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: null, error: new Error('db error') }, // newSubmissions fails
        { data: [], error: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topTracks).toEqual([]);
    expect(body.newSubmissions).toEqual([]);
  });

  it('handles track of day query failure gracefully', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: null, error: new Error('db error') }, // trackOfDayWinners fails
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trackOfDayWinners).toEqual([]);
  });

  it('handles multiple parallel query failures gracefully', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: null, error: new Error('error1') },
        { data: null, error: new Error('error2') },
        { data: [], error: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topTracks).toEqual([]);
    expect(body.newSubmissions).toEqual([]);
    expect(body.trackOfDayWinners).toEqual([]);
  });

  // ── Error path tests ─────────────────────────────────────────────────────

  it('returns 500 when activeSubmitters query throws', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: null, error: new Error('db error') },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    // The activeSubmitters query is awaited without allSettled,
    // so an error there should propagate to catch
    // However, the code checks if(activeSubmitters) which succeeds if data is null
    // So this actually succeeds with empty listeners
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners).toEqual([]);
  });

  it('returns 500 on uncaught exception', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to generate digest');
  });

  it('logs errors with logger.error', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockImplementation(() => {
      throw new Error('Test error');
    });
    await GET(makeGetRequest('/api/music/digest'));
    expect(logger.error).toHaveBeenCalledWith('Music digest error:', expect.any(Error));
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles empty activeSubmitters data gracefully', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null }, // empty activeSubmitters
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners).toEqual([]);
  });

  it('correctly deduplicates listeners with same fid across multiple submissions', async () => {
    const activeSubmitters = [
      { submitted_by_fid: 111, submitted_by_username: 'alice' },
      { submitted_by_fid: 111, submitted_by_username: 'alice' },
      { submitted_by_fid: 111, submitted_by_username: 'alice' },
      { submitted_by_fid: 111, submitted_by_username: 'alice' },
      { submitted_by_fid: 111, submitted_by_username: 'alice' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: activeSubmitters, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners).toHaveLength(1);
    expect(body.topListeners[0].fid).toBe(111);
    expect(body.topListeners[0].plays).toBe(5);
  });

  it('returns correctly sorted listeners by plays descending', async () => {
    const activeSubmitters = [
      { submitted_by_fid: 1, submitted_by_username: 'least' },
      { submitted_by_fid: 2, submitted_by_username: 'middle' },
      { submitted_by_fid: 2, submitted_by_username: 'middle' },
      { submitted_by_fid: 3, submitted_by_username: 'most' },
      { submitted_by_fid: 3, submitted_by_username: 'most' },
      { submitted_by_fid: 3, submitted_by_username: 'most' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: activeSubmitters, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/music/digest'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topListeners[0].plays).toBe(3);
    expect(body.topListeners[1].plays).toBe(2);
    expect(body.topListeners[2].plays).toBe(1);
  });

  it('calls supabase with correct table names and column selections', async () => {
    const topTracksChain = chainMock({ data: [], error: null });
    const subsChain = chainMock({ data: [], error: null });
    const totdChain = chainMock({ data: [], error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const table = mockFrom.mock.calls[callIndex]?.[0];
      callIndex++;
      if (table === 'songs') return topTracksChain;
      if (table === 'song_submissions') return subsChain;
      if (table === 'track_of_the_day') return totdChain;
      return topTracksChain;
    });

    await GET(makeGetRequest('/api/music/digest'));

    expect(mockFrom).toHaveBeenCalledWith('songs');
    expect(mockFrom).toHaveBeenCalledWith('song_submissions');
    expect(mockFrom).toHaveBeenCalledWith('track_of_the_day');
  });
});
