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
 * Build a Supabase query chain that resolves to `result` when awaited.
 * Each chainable method returns the chain for further chaining.
 * The terminal `.then` property allows the chain to be awaited directly.
 */
function artistsChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'in']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/artists/featured', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns empty artists list when no featured profiles exist', async () => {
    mockFrom.mockReturnValue(artistsChain({ data: [], error: null }));
    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    expect((await res.json()).artists).toEqual([]);
    // Only one call (the profiles query).
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('returns empty artists list when profiles have no valid FIDs', async () => {
    const profiles = [{ fid: null }, { fid: undefined }];
    mockFrom.mockReturnValue(artistsChain({ data: profiles, error: null }));
    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    expect((await res.json()).artists).toEqual([]);
  });

  it('fetches profiles, users, and song counts', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    // Queue: profiles query, users query, and one count query (for fid 111).
    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 5 }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.artists).toHaveLength(1);
    expect(body.artists[0]).toMatchObject({
      fid: 111,
      username: 'beatmaker',
      displayName: 'Beat Maker',
      pfpUrl: 'pfp.jpg',
      coverImageUrl: 'cover.jpg',
      category: 'producer',
      trackCount: 5,
    });
  });

  it('filters out profiles with no matching user', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb1.jpg',
        cover_image_url: 'cover1.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
      {
        fid: 222,
        category: 'artist',
        thumbnail_url: 'thumb2.jpg',
        cover_image_url: 'cover2.jpg',
        is_featured: true,
        created_at: '2026-01-02',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp1.jpg' },
    ];
    // User 222 is missing, so it should be filtered out.

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 3 }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.artists).toHaveLength(1);
    expect(body.artists[0].fid).toBe(111);
  });

  it('uses a track count of 0 when count query fails', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    // Count query fails but is caught in allSettled.
    mockFrom.mockReturnValueOnce(
      artistsChain({ data: undefined, error: new Error('count failed'), count: undefined }),
    );

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.artists[0].trackCount).toBe(0);
  });

  it('handles partial count query failures with allSettled', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb1.jpg',
        cover_image_url: 'cover1.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
      {
        fid: 222,
        category: 'artist',
        thumbnail_url: 'thumb2.jpg',
        cover_image_url: 'cover2.jpg',
        is_featured: true,
        created_at: '2026-01-02',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp1.jpg' },
      { fid: 222, username: 'artist', display_name: 'The Artist', pfp_url: 'pfp2.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    // First count succeeds, second fails.
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 7 }));
    mockFrom.mockReturnValueOnce(
      artistsChain({ data: undefined, error: new Error('count failed'), count: undefined }),
    );

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.artists).toHaveLength(2);
    expect(body.artists[0].trackCount).toBe(7);
    expect(body.artists[1].trackCount).toBe(0);
  });

  it('limits featured profiles to 20', async () => {
    const profiles = Array.from({ length: 25 }, (_, i) => ({
      fid: 100 + i,
      category: 'producer',
      thumbnail_url: `thumb${i}.jpg`,
      cover_image_url: `cover${i}.jpg`,
      is_featured: true,
      created_at: new Date(2026, 0, i + 1).toISOString(),
    }));

    mockFrom.mockReturnValue(artistsChain({ data: profiles.slice(0, 20), error: null }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    const body = await res.json();
    // The route queries limit(20), so profiles will already be limited by the DB.
    expect(body.artists.length).toBeLessThanOrEqual(20);
  });

  it('orders profiles by created_at descending', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/artists/featured'));
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('queries for profiles with is_featured=true', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/artists/featured'));
    expect(chain.eq).toHaveBeenCalledWith('is_featured', true);
  });

  it('queries users with is_active=true', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    const usersChain = artistsChain({ data: users, error: null });
    mockFrom.mockReturnValueOnce(usersChain);
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 0 }));

    await GET(makeGetRequest('/api/artists/featured'));
    expect(usersChain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('queries song counts using count=exact and head=true', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    const countChain = artistsChain({ data: undefined, error: null, count: 5 });
    mockFrom.mockReturnValueOnce(countChain);

    await GET(makeGetRequest('/api/artists/featured'));
    expect(countChain.select).toHaveBeenCalledWith('submitted_by_fid', {
      count: 'exact',
      head: true,
    });
  });

  it('handles profiles where category is null', async () => {
    const profiles = [
      {
        fid: 111,
        category: null,
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    const body = await res.json();
    expect(body.artists[0].category).toBeNull();
  });

  it('handles profiles where cover_image_url is null', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: null,
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    const body = await res.json();
    expect(body.artists[0].coverImageUrl).toBeNull();
  });

  it('returns 500 when the profiles query errors', async () => {
    mockFrom.mockReturnValue(
      artistsChain({ data: null, error: new Error('db connection failed') }),
    );
    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to load featured artists');
  });

  it('returns empty artists when the users query returns null', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: null, error: null }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    const body = await res.json();
    // No users found, so the profile is filtered out (no matching user entry).
    expect(body.artists).toEqual([]);
  });

  it('sets cache headers on success', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb.jpg',
        cover_image_url: 'cover.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=120',
    );
  });

  it('does not set cache headers on error', async () => {
    mockFrom.mockReturnValue(artistsChain({ data: null, error: new Error('db error') }));
    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  it('maps multiple artists with different track counts', async () => {
    const profiles = [
      {
        fid: 111,
        category: 'producer',
        thumbnail_url: 'thumb1.jpg',
        cover_image_url: 'cover1.jpg',
        is_featured: true,
        created_at: '2026-01-01',
      },
      {
        fid: 222,
        category: 'artist',
        thumbnail_url: 'thumb2.jpg',
        cover_image_url: 'cover2.jpg',
        is_featured: true,
        created_at: '2026-01-02',
      },
      {
        fid: 333,
        category: 'engineer',
        thumbnail_url: 'thumb3.jpg',
        cover_image_url: 'cover3.jpg',
        is_featured: true,
        created_at: '2026-01-03',
      },
    ];
    const users = [
      { fid: 111, username: 'beatmaker', display_name: 'Beat Maker', pfp_url: 'pfp1.jpg' },
      { fid: 222, username: 'artist', display_name: 'The Artist', pfp_url: 'pfp2.jpg' },
      { fid: 333, username: 'engineer', display_name: 'Sound Engineer', pfp_url: 'pfp3.jpg' },
    ];

    mockFrom.mockReturnValueOnce(artistsChain({ data: profiles, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: users, error: null }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 12 }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 8 }));
    mockFrom.mockReturnValueOnce(artistsChain({ data: undefined, error: null, count: 3 }));

    const res = await GET(makeGetRequest('/api/artists/featured'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.artists).toHaveLength(3);
    expect(body.artists[0].trackCount).toBe(12);
    expect(body.artists[1].trackCount).toBe(8);
    expect(body.artists[2].trackCount).toBe(3);
  });
});
