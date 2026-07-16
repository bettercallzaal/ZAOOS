import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Chain whose chainable methods (.select, .not, .in) are inspectable spies.
 * Supports .then() for direct await and resolves in FIFO order for sequential queries.
 * Used for songs, likes, and users queries.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'not', 'in', 'order', 'limit', 'filter']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('GET /api/music/curators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Authentication guard
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/music/curators'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Empty state: no songs, no curators
  // ─────────────────────────────────────────────────────────────────────────

  it('returns empty curators list when no songs exist', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    const res = await GET(makeGetRequest('/api/music/curators'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.curators).toEqual([]);
  });

  it('returns empty curators list when songs query returns null', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: null }]));
    const res = await GET(makeGetRequest('/api/music/curators'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.curators).toEqual([]);
  });

  it('returns empty curators list when no curators have likes', async () => {
    const songs = [{ id: 's1', submitted_by_fid: 100 }];
    const likes: unknown[] = [];
    const users = [
      {
        fid: 100,
        username: 'user1',
        display_name: 'User 1',
        pfp_url: 'https://example.com/pfp1.jpg',
      },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.curators).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Populated state: songs, likes, aggregation
  // ─────────────────────────────────────────────────────────────────────────

  it('aggregates likes by submitter FID', async () => {
    const songs = [
      { id: 's1', submitted_by_fid: 100 },
      { id: 's2', submitted_by_fid: 100 },
      { id: 's3', submitted_by_fid: 200 },
    ];
    const likes = [
      { song_id: 's1' },
      { song_id: 's1' },
      { song_id: 's2' },
      { song_id: 's3' },
      { song_id: 's3' },
      { song_id: 's3' },
    ];
    const users = [
      {
        fid: 100,
        username: 'curator1',
        display_name: 'Curator One',
        pfp_url: 'https://example.com/pfp1.jpg',
      },
      {
        fid: 200,
        username: 'curator2',
        display_name: 'Curator Two',
        pfp_url: 'https://example.com/pfp2.jpg',
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'songs') return queuedChain([{ data: songs, error: null }]);
      if (table === 'user_song_likes') return queuedChain([{ data: likes, error: null }]);
      if (table === 'users') return queuedChain([{ data: users, error: null }]);
      return queuedChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/music/curators'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.curators).toHaveLength(2);
    // Both have 3 likes total. Sort is by totalLikes DESC (stable sort).
    // FID 200 has 3 likes on 1 track, FID 100 has 3 likes on 2 tracks
    const fid200Curator = body.curators.find((c: { fid: number }) => c.fid === 200);
    const fid100Curator = body.curators.find((c: { fid: number }) => c.fid === 100);

    expect(fid200Curator).toEqual({
      fid: 200,
      username: 'curator2',
      displayName: 'Curator Two',
      pfpUrl: 'https://example.com/pfp2.jpg',
      totalLikes: 3,
      trackCount: 1,
    });

    expect(fid100Curator).toEqual({
      fid: 100,
      username: 'curator1',
      displayName: 'Curator One',
      pfpUrl: 'https://example.com/pfp1.jpg',
      totalLikes: 3,
      trackCount: 2,
    });
  });

  it('sorts curators by totalLikes DESC', async () => {
    const songs = [
      { id: 's1', submitted_by_fid: 100 },
      { id: 's2', submitted_by_fid: 200 },
      { id: 's3', submitted_by_fid: 300 },
    ];
    const likes = [
      { song_id: 's1' }, // s1: 1 like → FID 100: 1 like total
      { song_id: 's2' },
      { song_id: 's2' },
      { song_id: 's2' }, // s2: 3 likes → FID 200: 3 likes total
      { song_id: 's3' },
      { song_id: 's3' }, // s3: 2 likes → FID 300: 2 likes total
    ];
    const users = [
      { fid: 100, username: 'u100', display_name: 'User 100', pfp_url: null },
      { fid: 200, username: 'u200', display_name: 'User 200', pfp_url: null },
      { fid: 300, username: 'u300', display_name: 'User 300', pfp_url: null },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators[0].fid).toBe(200); // 3 likes
    expect(body.curators[1].fid).toBe(300); // 2 likes
    expect(body.curators[2].fid).toBe(100); // 1 like
  });

  it('limits results to top 20 curators', async () => {
    // Create 25 curators
    const songs: unknown[] = [];
    const likes: unknown[] = [];
    const users: unknown[] = [];

    for (let i = 1; i <= 25; i++) {
      songs.push({ id: `s${i}`, submitted_by_fid: i });
      // Each curator gets i likes (so 25 has 25, 24 has 24, etc.)
      for (let j = 0; j < i; j++) {
        likes.push({ song_id: `s${i}` });
      }
      users.push({
        fid: i,
        username: `user${i}`,
        display_name: `User ${i}`,
        pfp_url: null,
      });
    }

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators).toHaveLength(20);
    // Top curator should have 25 likes (FID 25)
    expect(body.curators[0].fid).toBe(25);
    expect(body.curators[0].totalLikes).toBe(25);
    // 20th curator should have 6 likes (FID 6, since 25..7 = 19, 6 is the 20th)
    expect(body.curators[19].fid).toBe(6);
    expect(body.curators[19].totalLikes).toBe(6);
  });

  it('includes user details (username, displayName, pfpUrl) in response', async () => {
    const songs = [{ id: 's1', submitted_by_fid: 100 }];
    const likes = [{ song_id: 's1' }];
    const users = [
      {
        fid: 100,
        username: 'curator_user',
        display_name: 'Curator Display',
        pfp_url: 'https://example.com/curator.jpg',
      },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators[0]).toEqual({
      fid: 100,
      username: 'curator_user',
      displayName: 'Curator Display',
      pfpUrl: 'https://example.com/curator.jpg',
      totalLikes: 1,
      trackCount: 1,
    });
  });

  it('uses empty string for missing username and null for missing displayName/pfpUrl', async () => {
    const songs = [{ id: 's1', submitted_by_fid: 100 }];
    const likes = [{ song_id: 's1' }];
    const users = [
      {
        fid: 100,
        username: null,
        display_name: null,
        pfp_url: null,
      },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators[0]).toEqual({
      fid: 100,
      username: '',
      displayName: null,
      pfpUrl: null,
      totalLikes: 1,
      trackCount: 1,
    });
  });

  it('handles missing user in users query (user not found)', async () => {
    const songs = [
      { id: 's1', submitted_by_fid: 100 },
      { id: 's2', submitted_by_fid: 200 },
    ];
    const likes = [{ song_id: 's1' }, { song_id: 's2' }];
    // Only FID 100 in users, FID 200 missing
    const users = [{ fid: 100, username: 'user100', display_name: 'User 100', pfp_url: null }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators).toHaveLength(2);
    // FID 100 is found
    expect(body.curators[0]).toEqual({
      fid: 100,
      username: 'user100',
      displayName: 'User 100',
      pfpUrl: null,
      totalLikes: 1,
      trackCount: 1,
    });
    // FID 200 is not found, fills defaults
    expect(body.curators[1]).toEqual({
      fid: 200,
      username: '',
      displayName: null,
      pfpUrl: null,
      totalLikes: 1,
      trackCount: 1,
    });
  });

  it('handles likes being null from query', async () => {
    const songs = [{ id: 's1', submitted_by_fid: 100 }];
    const likes = null;
    const users = [{ fid: 100, username: 'user1', display_name: 'User 1', pfp_url: null }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    // No curators because no likes (filtered out by totalLikes > 0)
    expect(body.curators).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Edge cases: multiple tracks per curator, like distribution
  // ─────────────────────────────────────────────────────────────────────────

  it('counts multiple likes on the same song', async () => {
    const songs = [{ id: 's1', submitted_by_fid: 100 }];
    const likes = [{ song_id: 's1' }, { song_id: 's1' }, { song_id: 's1' }];
    const users = [{ fid: 100, username: 'user1', display_name: 'User 1', pfp_url: null }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators[0].totalLikes).toBe(3);
    expect(body.curators[0].trackCount).toBe(1);
  });

  it('counts each track separately in trackCount', async () => {
    const songs = [
      { id: 's1', submitted_by_fid: 100 },
      { id: 's2', submitted_by_fid: 100 },
      { id: 's3', submitted_by_fid: 100 },
    ];
    const likes = [{ song_id: 's1' }, { song_id: 's2' }, { song_id: 's2' }, { song_id: 's3' }];
    const users = [{ fid: 100, username: 'user1', display_name: 'User 1', pfp_url: null }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: likes, error: null },
        { data: users, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));
    const body = await res.json();

    expect(body.curators[0].trackCount).toBe(3);
    expect(body.curators[0].totalLikes).toBe(4);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: songs query
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when songs query errors', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db down') }]));

    const res = await GET(makeGetRequest('/api/music/curators'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch curators');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: likes query
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when likes query errors', async () => {
    const songs = [{ id: 's1', submitted_by_fid: 100 }];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: songs, error: null },
        { data: null, error: new Error('likes query failed') },
      ]),
    );

    const res = await GET(makeGetRequest('/api/music/curators'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch curators');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: unexpected errors
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 and logs error on unexpected exception', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected runtime error');
    });

    const { logger } = await import('@/lib/logger');

    const res = await GET(makeGetRequest('/api/music/curators'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch curators');
    expect(logger.error).toHaveBeenCalledWith('[curators] GET failed:', expect.any(Error));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Query chain: verify correct methods called
  // ─────────────────────────────────────────────────────────────────────────

  it('calls songs query with .select and .not filters', async () => {
    const chain = queuedChain([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/music/curators'));

    expect(chain.select).toHaveBeenCalledWith('id, submitted_by_fid');
    expect(chain.not).toHaveBeenCalledWith('submitted_by_fid', 'is', null);
  });

  it('calls likes query with .select to fetch song_id', async () => {
    const songsChain = queuedChain([{ data: [{ id: 's1', submitted_by_fid: 100 }], error: null }]);
    const likesChain = queuedChain([{ data: [], error: null }]);
    const usersChain = queuedChain([{ data: [], error: null }]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'songs') return songsChain;
      if (table === 'user_song_likes') return likesChain;
      if (table === 'users') return usersChain;
      return queuedChain([{ data: [], error: null }]);
    });

    await GET(makeGetRequest('/api/music/curators'));

    expect(likesChain.select).toHaveBeenCalledWith('song_id');
  });

  it('calls users query with .in filter for the ranked FIDs', async () => {
    const songs = [
      { id: 's1', submitted_by_fid: 100 },
      { id: 's2', submitted_by_fid: 200 },
    ];
    const likes = [{ song_id: 's1' }, { song_id: 's2' }];
    const users = [
      { fid: 100, username: 'u100', display_name: 'U100', pfp_url: null },
      { fid: 200, username: 'u200', display_name: 'U200', pfp_url: null },
    ];

    const chain = queuedChain([
      { data: songs, error: null },
      { data: likes, error: null },
      { data: users, error: null },
    ]);
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/music/curators'));

    // Verify .in was called with the fids array
    expect(chain.in).toHaveBeenCalledWith('fid', expect.arrayContaining([100, 200]));
  });
});
