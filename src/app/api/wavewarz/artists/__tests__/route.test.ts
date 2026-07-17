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
 * A single chain object reused across every `.from()` call. Terminal awaits
 * (`then`) resolve to results in FIFO order.
 */
function artistsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'limit', 'not']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/wavewarz/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns artists when authenticated with default params', async () => {
    const artists = [
      { id: 1, name: 'Artist 1', wins: 10, total_volume_sol: 100 },
      { id: 2, name: 'Artist 2', wins: 8, total_volume_sol: 80 },
    ];
    mockFrom.mockReturnValue(artistsChain({ data: artists, error: null }));
    const res = await GET(makeGetRequest('/api/wavewarz/artists'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.artists).toEqual(artists);
  });

  it('returns empty artists list', async () => {
    mockFrom.mockReturnValue(artistsChain({ data: [], error: null }));
    const res = await GET(makeGetRequest('/api/wavewarz/artists'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.artists).toEqual([]);
  });

  it('sorts by wins by default', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(chain.order).toHaveBeenCalledWith('wins', { ascending: false });
  });

  it('sorts by total_volume_sol when sort param is provided', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { sort: 'total_volume_sol' }));
    expect(chain.order).toHaveBeenCalledWith('total_volume_sol', { ascending: false });
  });

  it('defaults to wins sort when sort param is invalid', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { sort: 'invalid_sort' }));
    expect(chain.order).toHaveBeenCalledWith('wins', { ascending: false });
  });

  it('uses default limit of 20 when not provided', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(chain.limit).toHaveBeenCalledWith(20);
  });

  it('respects the limit param when provided', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { limit: '10' }));
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('caps limit to 50 when exceeding max', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { limit: '100' }));
    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it('handles non-numeric limit gracefully by using default', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { limit: 'abc' }));
    expect(chain.limit).toHaveBeenCalledWith(20); // default, not NaN
  });

  it('does not apply linked_only filter when not provided', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(chain.not).not.toHaveBeenCalled();
  });

  it('does not apply linked_only filter when linked_only=false', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { linked_only: 'false' }));
    expect(chain.not).not.toHaveBeenCalled();
  });

  it('applies linked_only filter when linked_only=true', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists', { linked_only: 'true' }));
    expect(chain.not).toHaveBeenCalledWith('zao_fid', 'is', null);
  });

  it('returns cache headers on success', async () => {
    mockFrom.mockReturnValue(artistsChain({ data: [], error: null }));
    const res = await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=120, stale-while-revalidate=30',
    );
  });

  it('returns 500 when the query errors', async () => {
    mockFrom.mockReturnValue(artistsChain({ data: null, error: new Error('db down') }));
    const res = await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch artists');
  });

  it('logs the error when the query fails', async () => {
    const { logger } = await import('@/lib/logger');
    const dbError = new Error('db connection failed');
    mockFrom.mockReturnValue(artistsChain({ data: null, error: dbError }));
    await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(logger.error).toHaveBeenCalledWith('[wavewarz-artists] Fetch error:', dbError);
  });

  it('applies sort, limit, and linked_only filters together', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(
      makeGetRequest('/api/wavewarz/artists', {
        sort: 'total_volume_sol',
        limit: '25',
        linked_only: 'true',
      }),
    );
    expect(chain.order).toHaveBeenCalledWith('total_volume_sol', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(25);
    expect(chain.not).toHaveBeenCalledWith('zao_fid', 'is', null);
  });

  it('calls from() with the correct table name', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(mockFrom).toHaveBeenCalledWith('wavewarz_artists');
  });

  it('calls select with wildcard', async () => {
    const chain = artistsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/artists'));
    expect(chain.select).toHaveBeenCalledWith('*');
  });
});
