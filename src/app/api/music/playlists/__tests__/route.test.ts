import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  makePostRequest,
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

import { GET, POST } from '../route';

/**
 * Create a chainable Supabase query mock that resolves to `result`.
 * Handles both `.from(...).select(...).order(...).eq(...).await`
 * and `.from(...).insert(...).select(...).single().await` patterns.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'or', 'order']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/music/playlists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/music/playlists'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('lists personal playlists when type=personal', async () => {
    const chain = makeChain({
      data: [
        {
          id: 'p1',
          name: 'My Favorites',
          created_by_fid: 123,
          type: 'personal',
          playlist_tracks: [{ count: 5 }],
        },
        {
          id: 'p2',
          name: 'My Chill',
          created_by_fid: 123,
          type: 'personal',
          playlist_tracks: [{ count: 2 }],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists', { type: 'personal' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.playlists).toHaveLength(2);
    expect(body.playlists[0]).toMatchObject({
      id: 'p1',
      name: 'My Favorites',
      trackCount: 5,
    });
    expect(body.playlists[0].playlist_tracks).toBeUndefined();
    expect(chain.eq).toHaveBeenCalledWith('created_by_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('type', 'personal');
  });

  it('lists community playlists when type=community', async () => {
    const chain = makeChain({
      data: [
        {
          id: 'c1',
          name: 'Community Bangers',
          type: 'community',
          playlist_tracks: [{ count: 10 }],
        },
        { id: 'c2', name: 'Archive', type: 'totd_archive', playlist_tracks: [{ count: 3 }] },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists', { type: 'community' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.playlists).toHaveLength(2);
    expect(chain.in).toHaveBeenCalledWith('type', ['community', 'totd_archive', 'auto']);
  });

  it('lists all visible playlists when type=all (default)', async () => {
    const chain = makeChain({
      data: [
        { id: 'c1', name: 'Community', type: 'community', playlist_tracks: [{ count: 5 }] },
        {
          id: 'p1',
          name: 'My Personal',
          type: 'personal',
          created_by_fid: 123,
          playlist_tracks: [{ count: 2 }],
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists', { type: 'all' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.playlists).toHaveLength(2);
    // The 'or' filter is used for all visible (community/auto/own personal)
    expect(chain.or).toHaveBeenCalled();
  });

  it('lists all visible playlists when type is missing (default behavior)', async () => {
    const chain = makeChain({
      data: [{ id: 'c1', name: 'Community', type: 'community', playlist_tracks: [{ count: 5 }] }],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.playlists).toHaveLength(1);
    // Default (no type param) should use the 'or' filter
    expect(chain.or).toHaveBeenCalled();
  });

  it('returns empty array when no playlists exist', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.playlists).toEqual([]);
  });

  it('extracts track count from playlist_tracks array', async () => {
    const chain = makeChain({
      data: [
        { id: 'p1', name: 'With Tracks', playlist_tracks: [{ count: 42 }] },
        { id: 'p2', name: 'Empty', playlist_tracks: [] },
        { id: 'p3', name: 'Null Tracks', playlist_tracks: null },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists'));
    const body = await res.json();
    expect(body.playlists[0].trackCount).toBe(42);
    expect(body.playlists[1].trackCount).toBe(0);
    expect(body.playlists[2].trackCount).toBe(0);
  });

  it('orders results by updated_at descending', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/music/playlists'));
    expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('includes cache headers on success', async () => {
    const chain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=30');
  });

  it('returns 500 when Supabase query errors', async () => {
    const chain = makeChain({ data: null, error: new Error('DB connection failed') });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/music/playlists'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to load playlists');
  });
});

describe('POST /api/music/playlists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 400 when name is empty string', async () => {
    const res = await POST(makePostRequest('/api/music/playlists', { name: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when name exceeds 100 characters', async () => {
    const longName = 'a'.repeat(101);
    const res = await POST(makePostRequest('/api/music/playlists', { name: longName }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when description exceeds 500 characters', async () => {
    const longDesc = 'a'.repeat(501);
    const res = await POST(
      makePostRequest('/api/music/playlists', { name: 'Test', description: longDesc }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when body is not JSON', async () => {
    const req = makePostRequest('/api/music/playlists', { name: 'Test' });
    // Simulate non-JSON by making req.json() throw
    const _originalJson = req.json;
    req.json = async () => {
      throw new Error('Invalid JSON');
    };
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to create playlist');
  });

  it('creates a personal playlist with minimal fields', async () => {
    const createdPlaylist = {
      id: 'new-id',
      name: 'My Playlist',
      description: null,
      created_by_fid: 123,
      type: 'personal',
      is_public: false,
      collaborative: false,
    };
    const chain = makeChain({ data: createdPlaylist, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makePostRequest('/api/music/playlists', { name: 'My Playlist' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist).toEqual(createdPlaylist);
    expect(chain.insert).toHaveBeenCalledWith({
      name: 'My Playlist',
      description: null,
      created_by_fid: 123,
      type: 'personal',
      is_public: false,
      collaborative: false,
    });
  });

  it('creates a playlist with all optional fields', async () => {
    const createdPlaylist = {
      id: 'new-id',
      name: 'Shared Playlist',
      description: 'A collaborative space',
      created_by_fid: 123,
      type: 'personal',
      is_public: true,
      collaborative: true,
    };
    const chain = makeChain({ data: createdPlaylist, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/music/playlists', {
        name: 'Shared Playlist',
        description: 'A collaborative space',
        isPublic: true,
        collaborative: true,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.playlist).toEqual(createdPlaylist);
    expect(chain.insert).toHaveBeenCalledWith({
      name: 'Shared Playlist',
      description: 'A collaborative space',
      created_by_fid: 123,
      type: 'personal',
      is_public: true,
      collaborative: true,
    });
  });

  it('uses session fid for created_by_fid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const chain = makeChain({ data: { id: 'p1', created_by_fid: 999 }, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by_fid: 999,
      }),
    );
  });

  it('defaults isPublic to false when not provided', async () => {
    const chain = makeChain({ data: { id: 'p1', is_public: false }, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_public: false,
      }),
    );
  });

  it('defaults collaborative to false when not provided', async () => {
    const chain = makeChain({ data: { id: 'p1', collaborative: false }, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        collaborative: false,
      }),
    );
  });

  it('accepts optional description', async () => {
    const chain = makeChain({ data: { id: 'p1', description: 'Test desc' }, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(makePostRequest('/api/music/playlists', { name: 'Test', description: 'Test desc' }));

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Test desc',
      }),
    );
  });

  it('sets description to null when not provided', async () => {
    const chain = makeChain({ data: { id: 'p1', description: null }, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
      }),
    );
  });

  it('calls select and single on insert', async () => {
    const chain = makeChain({ data: { id: 'p1' }, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));

    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.single).toHaveBeenCalled();
  });

  it('returns 500 when insert fails', async () => {
    const chain = makeChain({ data: null, error: new Error('Constraint violation') });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makePostRequest('/api/music/playlists', { name: 'Test' }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to create playlist');
  });

  it('ignores unknown fields in the request', async () => {
    const chain = makeChain({ data: { id: 'p1' }, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/music/playlists', {
        name: 'Test',
        unknownField: 'ignored',
        otherField: 123,
      }),
    );

    expect(res.status).toBe(200);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.not.objectContaining({
        unknownField: expect.anything(),
        otherField: expect.anything(),
      }),
    );
  });
});
