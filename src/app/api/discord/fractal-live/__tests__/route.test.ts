import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetSupabaseAdmin, mockFrom } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Build a Supabase query chain for fractal_sessions queries.
 * Chainable methods (.eq, .order, .not, .limit) return the chain.
 * The chain resolves when awaited via .then.
 */
function fractalsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'order', 'not', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/discord/fractal-live', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // By default, all mocks return empty success
    mockGetSupabaseAdmin.mockReturnValue({
      from: mockFrom,
    });
  });

  it('returns active, paused, and recent sessions on success', async () => {
    const activeSessions = [{ id: 'a1', status: 'active', created_at: '2026-07-16T00:00:00Z' }];
    const pausedSessions = [{ id: 'p1', status: 'paused', created_at: '2026-07-15T00:00:00Z' }];
    const recentSessions = [
      {
        id: 'r1',
        status: 'completed',
        discord_thread_id: 'thread123',
        created_at: '2026-07-14T00:00:00Z',
      },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const result =
        callCount === 0
          ? { data: activeSessions, error: null }
          : callCount === 1
            ? { data: recentSessions, error: null }
            : { data: pausedSessions, error: null };
      callCount += 1;
      return fractalsChain(result);
    });

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.active).toEqual(activeSessions);
    expect(body.paused).toEqual(pausedSessions);
    expect(body.recent).toEqual(recentSessions);
    expect(body.has_active).toBe(true);
  });

  it('returns empty arrays when all queries return null', async () => {
    let _callCount = 0;
    mockFrom.mockImplementation(() => {
      _callCount += 1;
      return fractalsChain({ data: null, error: null });
    });

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.active).toEqual([]);
    expect(body.paused).toEqual([]);
    expect(body.recent).toEqual([]);
    expect(body.has_active).toBe(false);
  });

  it('returns 500 when active sessions query errors', async () => {
    mockFrom.mockReturnValue(fractalsChain({ data: null, error: new Error('db down') }));

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch active sessions');
  });

  it('returns active sessions even if recent sessions query errors', async () => {
    const activeSessions = [{ id: 'a1', status: 'active' }];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const result =
        callCount === 0
          ? { data: activeSessions, error: null }
          : { data: null, error: new Error('recent query failed') };
      callCount += 1;
      return fractalsChain(result);
    });

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.active).toEqual(activeSessions);
    expect(body.recent).toEqual([]);
  });

  it('returns active sessions even if paused sessions query errors', async () => {
    const activeSessions = [{ id: 'a1', status: 'active' }];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      if (callCount === 0) {
        callCount += 1;
        return fractalsChain({ data: activeSessions, error: null });
      }
      if (callCount === 1) {
        callCount += 1;
        return fractalsChain({ data: [], error: null });
      }
      return fractalsChain({ data: null, error: new Error('paused query failed') });
    });

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.active).toEqual(activeSessions);
    expect(body.paused).toEqual([]);
  });

  it('applies correct query filters to each call', async () => {
    mockFrom.mockImplementation(() => fractalsChain({ data: [], error: null }));

    await GET(makeGetRequest('/api/discord/fractal-live'));

    // Called 3 times, each starting with .from('fractal_sessions').select('*')
    expect(mockFrom).toHaveBeenCalledWith('fractal_sessions');
    expect(mockFrom).toHaveBeenCalledTimes(3);
  });

  it('returns 500 on unexpected exception', async () => {
    mockGetSupabaseAdmin.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('sets has_active to false when active sessions is empty', async () => {
    let _callCount = 0;
    mockFrom.mockImplementation(() => {
      _callCount += 1;
      return fractalsChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/discord/fractal-live'));
    const body = await res.json();
    expect(body.has_active).toBe(false);
  });
});
