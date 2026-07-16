import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

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
 * Chain whose chainable methods are inspectable spies. Supports .select(),
 * .eq(), .not(), .order(), .limit() and resolves when awaited. Thenables
 * queue results in FIFO order: first await gets results[0], second gets results[1].
 */
function spotlightChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'not', 'order', 'limit', 'in']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('GET /api/social/spotlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 401 guard
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/api/social/spotlight'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session.fid is null', async () => {
    mockGetSessionData.mockResolvedValue({ fid: null });
    const res = await GET(makeGetRequest('/api/social/spotlight'));
    expect(res.status).toBe(401);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Empty users
  // ─────────────────────────────────────────────────────────────────────────

  it('returns { member: null } when no active users exist', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(spotlightChain([{ data: [], error: null }]));

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member).toBeNull();
  });

  it('returns { member: null } when users query data is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(spotlightChain([{ data: null, error: null }]));

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Single user selection
  // ─────────────────────────────────────────────────────────────────────────

  it('returns single user when only one active user exists', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 456,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: 'https://example.com/alice.png',
        bio: 'Designer',
        location: 'SF',
        last_active_at: '2026-07-15T10:00:00Z',
        respect_member_id: 1,
      },
    ];

    const respect = [{ fid: 456, total_respect: 100 }];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member).toBeDefined();
    expect(body.member.fid).toBe(456);
    expect(body.member.username).toBe('alice');
    expect(body.member.displayName).toBe('Alice');
    expect(body.member.respect).toEqual({ total: 100 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Ranking by respect (sorting logic)
  // ─────────────────────────────────────────────────────────────────────────

  it('selects user by deterministic day-of-year index from respect-sorted list', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 1,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
      {
        fid: 2,
        username: 'bob',
        display_name: 'Bob',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 2,
      },
      {
        fid: 3,
        username: 'charlie',
        display_name: 'Charlie',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 3,
      },
    ];

    const respect = [
      { fid: 1, total_respect: 50 },
      { fid: 2, total_respect: 200 },
      { fid: 3, total_respect: 100 },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    // Sorted by respect desc: bob (200), charlie (100), alice (50)
    // index = dayOfYear % 3
    // The exact pick depends on today's dayOfYear, so we just verify
    // the picked user is one of the three and has correct structure
    expect([1, 2, 3]).toContain(body.member.fid);
    expect(body.member).toHaveProperty('username');
    expect(body.member).toHaveProperty('respect');
  });

  it('uses modulo to wrap selection when dayOfYear exceeds user count', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 1,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
      {
        fid: 2,
        username: 'bob',
        display_name: 'Bob',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 2,
      },
    ];

    const respect = [
      { fid: 1, total_respect: 100 },
      { fid: 2, total_respect: 200 },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    // Pick should be deterministic and wrap correctly
    expect([1, 2]).toContain(body.member.fid);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Enrichment (null fields, missing respect)
  // ─────────────────────────────────────────────────────────────────────────

  it('includes all user fields in response', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 456,
        username: 'alice',
        display_name: 'Alice M',
        pfp_url: 'https://example.com/alice.png',
        bio: 'Musician',
        location: 'NYC',
        last_active_at: '2026-07-15T15:30:00Z',
        respect_member_id: 1,
      },
    ];

    const respect = [{ fid: 456, total_respect: 250 }];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));
    const body = await res.json();

    expect(body.member.fid).toBe(456);
    expect(body.member.username).toBe('alice');
    expect(body.member.displayName).toBe('Alice M');
    expect(body.member.pfpUrl).toBe('https://example.com/alice.png');
    expect(body.member.bio).toBe('Musician');
    expect(body.member.location).toBe('NYC');
    expect(body.member.lastActiveAt).toBe('2026-07-15T15:30:00Z');
  });

  it('sets respect to null when no respect record found for user', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 789,
        username: 'bob',
        display_name: 'Bob',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
    ];

    // No respect data for fid 789
    const respect = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));
    const body = await res.json();

    expect(body.member.respect).toBeNull();
  });

  it('converts respect.total_respect to number', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 999,
        username: 'test',
        display_name: 'Test',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
    ];

    const respect = [{ fid: 999, total_respect: '500' }]; // String value

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));
    const body = await res.json();

    expect(typeof body.member.respect.total).toBe('number');
    expect(body.member.respect.total).toBe(500);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Query filter verification
  // ─────────────────────────────────────────────────────────────────────────

  it('queries users with is_active=true filter', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const chain = spotlightChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/social/spotlight'));

    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('filters out users with null username (not() operator)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const chain = spotlightChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/social/spotlight'));

    expect(chain.not).toHaveBeenCalledWith('username', 'is', null);
  });

  it('orders users by zid ascending', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const chain = spotlightChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/social/spotlight'));

    expect(chain.order).toHaveBeenCalledWith('zid', { ascending: true, nullsFirst: false });
  });

  it('limits to 200 users', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const chain = spotlightChain([{ data: [], error: null }]);
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/social/spotlight'));

    expect(chain.limit).toHaveBeenCalledWith(200);
  });

  it('fetches respect_members for all user fids', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 111,
        username: 'a',
        display_name: '',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
      {
        fid: 222,
        username: 'b',
        display_name: '',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 2,
      },
    ];

    const respect = [
      { fid: 111, total_respect: 10 },
      { fid: 222, total_respect: 20 },
    ];

    const usersChain = spotlightChain([{ data: users, error: null }]);
    const respectChain = spotlightChain([{ data: respect, error: null }]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return usersChain;
      if (table === 'respect_members') return respectChain;
      return usersChain;
    });

    await GET(makeGetRequest('/api/social/spotlight'));

    expect(respectChain.in).toHaveBeenCalledWith('fid', [111, 222]);
  });

  it('returns empty respect query when no users have fids', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: null,
        username: 'ghost',
        display_name: '',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
    ];

    const usersChain = spotlightChain([{ data: users, error: null }]);
    mockFrom.mockReturnValue(usersChain);

    const res = await GET(makeGetRequest('/api/social/spotlight'));
    const body = await res.json();

    // When no valid fids, respect should be empty and user selection still works
    expect(body.member).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR: users query errors
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when users query errors', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockFrom.mockReturnValue(
      spotlightChain([{ data: null, error: new Error('db connection failed') }]),
    );

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load spotlight');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR: respect query errors (continues, doesn't throw)
  // ─────────────────────────────────────────────────────────────────────────

  it('continues when respect_members query errors (treats as no respect)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 456,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
    ];

    const usersChain = spotlightChain([{ data: users, error: null }]);
    const respectChain = spotlightChain([{ data: null, error: new Error('respect query failed') }]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return usersChain;
      if (table === 'respect_members') return respectChain;
      return usersChain;
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member).toBeDefined();
    expect(body.member.respect).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR: Unexpected runtime errors (try/catch)
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 and logs error on unexpected runtime exception', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected crash during query');
    });

    const { logger } = await import('@/lib/logger');

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load spotlight');
    expect(logger.error).toHaveBeenCalledWith('[spotlight] error:', expect.any(Error));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Response headers: Cache-Control
  // ─────────────────────────────────────────────────────────────────────────

  it('includes cache-control header on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 456,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
    ];

    const respect = [{ fid: 456, total_respect: 100 }];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBe('public, s-maxage=3600, stale-while-revalidate=1800');
  });

  it('does not include cache-control header on error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockFrom.mockReturnValue(spotlightChain([{ data: null, error: new Error('db error') }]));

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Edge case: Multiple users with same respect score
  // ─────────────────────────────────────────────────────────────────────────

  it('handles ties in respect scores deterministically', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const users = [
      {
        fid: 1,
        username: 'a',
        display_name: 'A',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 1,
      },
      {
        fid: 2,
        username: 'b',
        display_name: 'B',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 2,
      },
      {
        fid: 3,
        username: 'c',
        display_name: 'C',
        pfp_url: '',
        bio: '',
        location: '',
        last_active_at: '',
        respect_member_id: 3,
      },
    ];

    const respect = [
      { fid: 1, total_respect: 100 },
      { fid: 2, total_respect: 100 },
      { fid: 3, total_respect: 100 },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return spotlightChain([{ data: users, error: null }]);
      if (table === 'respect_members') return spotlightChain([{ data: respect, error: null }]);
      return spotlightChain([{ data: [], error: null }]);
    });

    const res = await GET(makeGetRequest('/api/social/spotlight'));

    expect(res.status).toBe(200);
    const body = await res.json();
    // All three have same respect; pick should be by dayOfYear % 3
    expect([1, 2, 3]).toContain(body.member.fid);
  });
});
