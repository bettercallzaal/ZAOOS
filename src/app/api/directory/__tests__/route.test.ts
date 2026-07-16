import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  makePostRequest,
  mockAdminSession,
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

import { GET, PATCH } from '../route';

/**
 * A single chain object reused across every `.from()` call. Terminal awaits
 * resolve to results in FIFO order. For GET, one result; for PATCH, one result.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'range', 'eq', 'ilike', 'not', 'is', 'contains', 'update']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('GET /api/directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/directory'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns empty profiles list on success', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null, count: 0 }]));
    const res = await GET(makeGetRequest('/api/directory'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.profiles).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
  });

  it('returns profiles when present', async () => {
    const profiles = [
      { id: 'p1', name: 'Alice', category: 'developer', is_featured: true },
      { id: 'p2', name: 'Bob', category: 'artist', is_featured: false },
    ];
    mockFrom.mockReturnValue(queuedChain([{ data: profiles, error: null, count: 2 }]));
    const res = await GET(makeGetRequest('/api/directory'));
    const body = await res.json();
    expect(body.profiles).toEqual(profiles);
    expect(body.total).toBe(2);
  });

  it('applies category equality filter when category is not "all"', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { category: 'developer' }));
    expect(chain.eq).toHaveBeenCalledWith('category', 'developer');
  });

  it('does not apply category filter when category is "all"', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { category: 'all' }));
    expect(chain.eq).not.toHaveBeenCalledWith('category', 'all');
  });

  it('applies search filter with ilike on name', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { search: 'alice' }));
    expect(chain.ilike).toHaveBeenCalledWith('name', '%alice%');
  });

  it('applies social filter using not().is(null)', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { social: 'twitter' }));
    expect(chain.not).toHaveBeenCalledWith('twitter', 'is', null);
  });

  it('applies tag filter using contains', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { tag: 'music' }));
    expect(chain.contains).toHaveBeenCalledWith('tags', ['music']);
  });

  it('respects limit parameter capped at 100', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { limit: '200' }));
    expect(chain.range).toHaveBeenCalledWith(0, 99);
  });

  it('uses default limit of 50', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory'));
    expect(chain.range).toHaveBeenCalledWith(0, 49);
  });

  it('respects offset parameter', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { offset: '30' }));
    expect(chain.range).toHaveBeenCalledWith(30, 79);
  });

  it('clamps negative offset to 0', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory', { offset: '-10' }));
    expect(chain.range).toHaveBeenCalledWith(0, 49);
  });

  it('orders by is_featured desc then name asc', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/directory'));
    expect(chain.order).toHaveBeenNthCalledWith(1, 'is_featured', { ascending: false });
    expect(chain.order).toHaveBeenNthCalledWith(2, 'name', { ascending: true });
  });

  it('returns 500 when query fails', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db error') }]));
    const res = await GET(makeGetRequest('/api/directory'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch directory');
  });

  it('applies multiple filters together (search + category + tag)', async () => {
    const chain = queuedChain([{ data: [], error: null, count: 0 }]);
    mockFrom.mockReturnValue(chain);
    await GET(
      makeGetRequest('/api/directory', {
        search: 'musician',
        category: 'artist',
        tag: 'music',
      }),
    );
    expect(chain.ilike).toHaveBeenCalledWith('name', '%musician%');
    expect(chain.eq).toHaveBeenCalledWith('category', 'artist');
    expect(chain.contains).toHaveBeenCalledWith('tags', ['music']);
  });
});

describe('PATCH /api/directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await PATCH(makePostRequest('/api/directory', { id: 'p1' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Forbidden');
  });

  it('returns 403 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await PATCH(makePostRequest('/api/directory', { id: 'p1' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Forbidden');
  });

  it('returns 400 when id is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await PATCH(makePostRequest('/api/directory', { tags: ['new'] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Missing id');
  });

  it('updates tags and returns success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: null }]));
    const res = await PATCH(makePostRequest('/api/directory', { id: 'p1', tags: ['music'] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('updates admin_notes and returns success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: null }]));
    const res = await PATCH(
      makePostRequest('/api/directory', { id: 'p1', admin_notes: 'verified' }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('updates is_featured and returns success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: null }]));
    const res = await PATCH(makePostRequest('/api/directory', { id: 'p1', is_featured: true }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('always sets updated_at to current ISO timestamp', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(makePostRequest('/api/directory', { id: 'p1', tags: ['new'] }));
    const calls = chain.update.mock.calls;
    expect(calls[0][0]).toHaveProperty('updated_at');
    expect(typeof calls[0][0].updated_at).toBe('string');
  });

  it('includes tags in update when provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(makePostRequest('/api/directory', { id: 'p1', tags: ['music', 'art'] }));
    const updates = chain.update.mock.calls[0][0];
    expect(updates.tags).toEqual(['music', 'art']);
  });

  it('includes admin_notes in update when provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(makePostRequest('/api/directory', { id: 'p1', admin_notes: 'verified' }));
    const updates = chain.update.mock.calls[0][0];
    expect(updates.admin_notes).toBe('verified');
  });

  it('includes is_featured in update when provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(makePostRequest('/api/directory', { id: 'p1', is_featured: true }));
    const updates = chain.update.mock.calls[0][0];
    expect(updates.is_featured).toBe(true);
  });

  it('does not include tags in update when not provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(makePostRequest('/api/directory', { id: 'p1', admin_notes: 'test' }));
    const updates = chain.update.mock.calls[0][0];
    expect(updates.tags).toBeUndefined();
  });

  it('updates multiple fields at once', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(
      makePostRequest('/api/directory', {
        id: 'p1',
        tags: ['music'],
        admin_notes: 'featured',
        is_featured: true,
      }),
    );
    const updates = chain.update.mock.calls[0][0];
    expect(updates.tags).toEqual(['music']);
    expect(updates.admin_notes).toBe('featured');
    expect(updates.is_featured).toBe(true);
  });

  it('filters updates to community_profiles table by id', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = queuedChain([{ data: null, error: null }]);
    mockFrom.mockReturnValue(chain);
    await PATCH(makePostRequest('/api/directory', { id: 'p1', tags: ['new'] }));
    expect(mockFrom).toHaveBeenCalledWith('community_profiles');
    expect(chain.eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('returns 500 when update query fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db error') }]));
    const res = await PATCH(makePostRequest('/api/directory', { id: 'p1', tags: ['new'] }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to update');
  });

  it('returns 500 when request body is invalid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = new Request('http://localhost:3000/api/directory', {
      method: 'PATCH',
      body: 'invalid json',
    });
    const nextReq = new (await import('next/server')).NextRequest(req);
    const res = await PATCH(nextReq);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to update');
  });
});
