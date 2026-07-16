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
function battlesChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'limit', 'or']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/wavewarz/battles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns battles when authenticated with default params', async () => {
    const battles = [
      {
        id: 1,
        artist_a: 'Artist 1',
        artist_b: 'Artist 2',
        settled_at: '2026-07-15T10:00:00Z',
        volume: 100,
      },
      {
        id: 2,
        artist_a: 'Artist 3',
        artist_b: 'Artist 4',
        settled_at: '2026-07-14T10:00:00Z',
        volume: 200,
      },
    ];
    mockFrom.mockReturnValue(battlesChain({ data: battles, error: null }));
    const res = await GET(makeGetRequest('/api/wavewarz/battles'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.battles).toEqual(battles);
  });

  it('returns empty battles list', async () => {
    mockFrom.mockReturnValue(battlesChain({ data: [], error: null }));
    const res = await GET(makeGetRequest('/api/wavewarz/battles'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.battles).toEqual([]);
  });

  it('defaults to limit of 30 when not provided', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(chain.limit).toHaveBeenCalledWith(30);
  });

  it('respects the limit param when provided', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles', { limit: '15' }));
    expect(chain.limit).toHaveBeenCalledWith(15);
  });

  it('caps limit to 100 when exceeding max', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles', { limit: '200' }));
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('handles non-numeric limit gracefully', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles', { limit: 'abc' }));
    expect(chain.limit).toHaveBeenCalled();
  });

  it('does not apply artist filter when not provided', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(chain.or).not.toHaveBeenCalled();
  });

  it('applies artist filter when artist param is provided', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles', { artist: 'Drake' }));
    expect(chain.or).toHaveBeenCalledWith('artist_a.ilike.%Drake%,artist_b.ilike.%Drake%');
  });

  it('handles special characters in artist filter', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles', { artist: "O'Reilly" }));
    expect(chain.or).toHaveBeenCalledWith("artist_a.ilike.%O'Reilly%,artist_b.ilike.%O'Reilly%");
  });

  it('orders by settled_at descending', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(chain.order).toHaveBeenCalledWith('settled_at', { ascending: false });
  });

  it('returns cache headers on success', async () => {
    mockFrom.mockReturnValue(battlesChain({ data: [], error: null }));
    const res = await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=30');
  });

  it('returns 500 when the query errors', async () => {
    mockFrom.mockReturnValue(battlesChain({ data: null, error: new Error('db down') }));
    const res = await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch');
  });

  it('logs the error when the query fails', async () => {
    const { logger } = await import('@/lib/logger');
    const dbError = new Error('db connection failed');
    mockFrom.mockReturnValue(battlesChain({ data: null, error: dbError }));
    await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(logger.error).toHaveBeenCalledWith('[wavewarz/battles] Error:', dbError);
  });

  it('applies limit and artist filter together', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles', { limit: '50', artist: 'Kanye' }));
    expect(chain.limit).toHaveBeenCalledWith(50);
    expect(chain.or).toHaveBeenCalledWith('artist_a.ilike.%Kanye%,artist_b.ilike.%Kanye%');
  });

  it('calls from() with the correct table name', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(mockFrom).toHaveBeenCalledWith('wavewarz_battle_log');
  });

  it('calls select with wildcard', async () => {
    const chain = battlesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(chain.select).toHaveBeenCalledWith('*');
  });

  it('handles catch-all error path', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected error');
    });
    const res = await GET(makeGetRequest('/api/wavewarz/battles'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch');
    expect(logger.error).toHaveBeenCalled();
  });
});
