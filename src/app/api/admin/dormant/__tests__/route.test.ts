import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAdminSession,
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
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { GET } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result in FIFO order.
 * Every chained method returns the chain itself for fluency.
 * Terminal .then() resolves results in the order queued.
 *
 * Usage:
 *   const chain = queuedChain([
 *     { data: users, error: null },       // first query (users table)
 *     { data: respectRows, error: null }, // second query (respect_members)
 *   ]);
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // All chainable methods return the chain for fluency
  for (const m of [
    'select',
    'eq',
    'not',
    'lt',
    'gt',
    'gte',
    'lte',
    'in',
    'order',
    'limit',
    'range',
  ]) {
    chain[m] = vi.fn(() => chain);
  }

  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());

  return chain;
}

describe('GET /api/admin/dormant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin required');
  });

  it('returns 403 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin required');
  });

  it('returns 403 when isAdmin is explicitly false', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin required');
  });

  // ── Query validation tests ────────────────────────────────────────────────

  it('returns 400 when days param is below minimum (7)', async () => {
    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '6' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when days param is above maximum (365)', async () => {
    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '366' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when days param is not an integer', async () => {
    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '30.5' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('returns 400 when days param is non-numeric', async () => {
    const res = await GET(makeGetRequest('/api/admin/dormant', { days: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('defaults days to 30 when omitted', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cutoffDays).toBe(30);
  });

  it('accepts days within valid range (7 to 365)', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '90' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cutoffDays).toBe(90);
  });

  it('accepts boundary values (7 and 365)', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));

    const res7 = await GET(makeGetRequest('/api/admin/dormant', { days: '7' }));
    expect(res7.status).toBe(200);
    expect((await res7.json()).cutoffDays).toBe(7);

    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    const res365 = await GET(makeGetRequest('/api/admin/dormant', { days: '365' }));
    expect(res365.status).toBe(200);
    expect((await res365.json()).cutoffDays).toBe(365);
  });

  // ── Dormant member selection tests ────────────────────────────────────────

  it('returns empty dormant list when no users match criteria', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '30' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dormant).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.cutoffDays).toBe(30);
  });

  it('queries users with is_active=true, last_active_at not null, and last_active_at < cutoff', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    await GET(makeGetRequest('/api/admin/dormant', { days: '30' }));

    const chain = mockFrom.mock.results[0].value;
    expect(chain.select).toHaveBeenCalledWith(
      'id, fid, username, display_name, pfp_url, last_active_at, respect_member_id',
    );
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(chain.not).toHaveBeenCalledWith('last_active_at', 'is', null);
    expect(chain.lt).toHaveBeenCalled(); // checks last_active_at < cutoff
  });

  it('orders results by last_active_at ascending (oldest first)', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    await GET(makeGetRequest('/api/admin/dormant'));

    const chain = mockFrom.mock.results[0].value;
    expect(chain.order).toHaveBeenCalledWith('last_active_at', { ascending: true });
  });

  it('limits results to 100 users', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));
    await GET(makeGetRequest('/api/admin/dormant'));

    const chain = mockFrom.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  // ── Respect enrichment tests ──────────────────────────────────────────────

  it('returns dormant users without respect data when respect_member_id is null', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: null,
      },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        // No respect_members query when no IDs to look up
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '30' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dormant).toHaveLength(1);
    expect(body.dormant[0]).toMatchObject({
      id: 'u1',
      fid: 123,
      username: 'user1',
      displayName: 'User One',
      pfpUrl: 'https://example.com/pfp1.jpg',
      totalRespect: 0,
      fractalCount: 0,
    });
  });

  it('fetches and enriches respect data when respect_member_ids are present', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
      {
        id: 'u2',
        fid: 456,
        username: 'user2',
        display_name: 'User Two',
        pfp_url: 'https://example.com/pfp2.jpg',
        last_active_at: '2026-06-10T08:00:00Z',
        respect_member_id: 'r2',
      },
    ];

    const respectRows = [
      { id: 'r1', total_respect: 500, fractal_count: 10 },
      { id: 'r2', total_respect: 300, fractal_count: 5 },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: respectRows, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dormant).toHaveLength(2);
    // Should be sorted by totalRespect descending (u1: 500 first, u2: 300 second)
    expect(body.dormant[0]).toMatchObject({
      id: 'u1',
      totalRespect: 500,
      fractalCount: 10,
    });
    expect(body.dormant[1]).toMatchObject({
      id: 'u2',
      totalRespect: 300,
      fractalCount: 5,
    });
  });

  it('filters respect_member_ids to exclude null values', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
      {
        id: 'u2',
        fid: 456,
        username: 'user2',
        display_name: 'User Two',
        pfp_url: 'https://example.com/pfp2.jpg',
        last_active_at: '2026-06-10T08:00:00Z',
        respect_member_id: null,
      },
    ];

    const respectRows = [{ id: 'r1', total_respect: 500, fractal_count: 10 }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: respectRows, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // The respect query should only query r1, not null
    const chain = mockFrom.mock.results[1].value;
    expect(chain.in).toHaveBeenCalledWith('id', ['r1']);

    expect(body.dormant).toHaveLength(2);
    expect(body.dormant[0]).toMatchObject({
      id: 'u1',
      totalRespect: 500,
    });
    expect(body.dormant[1]).toMatchObject({
      id: 'u2',
      totalRespect: 0, // null member has no respect data
    });
  });

  it('handles missing total_respect and fractal_count as 0', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
    ];

    const respectRows = [{ id: 'r1', total_respect: null, fractal_count: null }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: respectRows, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dormant[0]).toMatchObject({
      totalRespect: 0,
      fractalCount: 0,
    });
  });

  it('does not query respect_members when no users have respect_member_id', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: null,
      },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        // No second query; respect_members is skipped
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);

    // Only 1 call to from() for users table; respect_members skipped
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  // ── Response shape and sorting tests ──────────────────────────────────────

  it('calculates daysSinceActive correctly', async () => {
    const now = Date.now();
    const pastDate = new Date(now - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: pastDate.toISOString(),
        respect_member_id: null,
      },
    ];

    mockFrom.mockReturnValue(queuedChain([{ data: users, error: null }]));

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dormant[0].daysSinceActive).toBe(2);
  });

  it('sorts dormant users by totalRespect descending', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
      {
        id: 'u2',
        fid: 456,
        username: 'user2',
        display_name: 'User Two',
        pfp_url: 'https://example.com/pfp2.jpg',
        last_active_at: '2026-06-10T08:00:00Z',
        respect_member_id: 'r2',
      },
      {
        id: 'u3',
        fid: 789,
        username: 'user3',
        display_name: 'User Three',
        pfp_url: 'https://example.com/pfp3.jpg',
        last_active_at: '2026-06-05T06:00:00Z',
        respect_member_id: 'r3',
      },
    ];

    const respectRows = [
      { id: 'r1', total_respect: 100, fractal_count: 2 },
      { id: 'r2', total_respect: 500, fractal_count: 8 },
      { id: 'r3', total_respect: 300, fractal_count: 5 },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: respectRows, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should be sorted by totalRespect descending: 500, 300, 100
    expect(body.dormant[0].totalRespect).toBe(500);
    expect(body.dormant[1].totalRespect).toBe(300);
    expect(body.dormant[2].totalRespect).toBe(100);
  });

  it('includes all required fields in response', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
    ];

    const respectRows = [{ id: 'r1', total_respect: 250, fractal_count: 5 }];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: respectRows, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    const dormantUser = body.dormant[0];
    expect(dormantUser).toHaveProperty('id');
    expect(dormantUser).toHaveProperty('fid');
    expect(dormantUser).toHaveProperty('username');
    expect(dormantUser).toHaveProperty('displayName');
    expect(dormantUser).toHaveProperty('pfpUrl');
    expect(dormantUser).toHaveProperty('lastActiveAt');
    expect(dormantUser).toHaveProperty('daysSinceActive');
    expect(dormantUser).toHaveProperty('totalRespect');
    expect(dormantUser).toHaveProperty('fractalCount');
  });

  it('returns response with dormant array, total, and cutoffDays', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
      {
        id: 'u2',
        fid: 456,
        username: 'user2',
        display_name: 'User Two',
        pfp_url: 'https://example.com/pfp2.jpg',
        last_active_at: '2026-06-10T08:00:00Z',
        respect_member_id: 'r2',
      },
    ];

    const respectRows = [
      { id: 'r1', total_respect: 500, fractal_count: 10 },
      { id: 'r2', total_respect: 300, fractal_count: 5 },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: respectRows, error: null },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant', { days: '60' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('dormant');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('cutoffDays');
    expect(body.dormant).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.cutoffDays).toBe(60);
  });

  // ── Error handling tests ──────────────────────────────────────────────────

  it('returns 500 when users query errors', async () => {
    mockFrom.mockReturnValue(
      queuedChain([{ data: null, error: new Error('Database connection failed') }]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch dormant members');
  });

  it('returns 500 when an unexpected exception is thrown', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch dormant members');
  });

  it('logs error when users query fails', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('Database error') }]));

    await GET(makeGetRequest('/api/admin/dormant'));

    expect(logger.error).toHaveBeenCalledWith('[admin/dormant] error:', expect.any(Error));
  });

  it('gracefully handles respect query errors (silent ignore)', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: null, error: new Error('Respect query failed') },
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Respect errors are silently ignored (no data): user gets 0 respect
    expect(body.dormant[0]).toMatchObject({
      totalRespect: 0,
      fractalCount: 0,
    });
  });

  // ── Edge case tests ──────────────────────────────────────────────────────

  it('handles empty respect_members result gracefully', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: 'r1',
      },
    ];

    mockFrom.mockReturnValue(
      queuedChain([
        { data: users, error: null },
        { data: [], error: null }, // No respect rows found
      ]),
    );

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dormant[0]).toMatchObject({
      totalRespect: 0,
      fractalCount: 0,
    });
  });

  it('handles user without display_name', async () => {
    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: null,
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: '2026-06-15T10:00:00Z',
        respect_member_id: null,
      },
    ];

    mockFrom.mockReturnValue(queuedChain([{ data: users, error: null }]));

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dormant[0]).toMatchObject({
      username: 'user1',
      displayName: null,
    });
  });

  it('handles large daysSinceActive values', async () => {
    const veryOldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

    const users = [
      {
        id: 'u1',
        fid: 123,
        username: 'user1',
        display_name: 'User One',
        pfp_url: 'https://example.com/pfp1.jpg',
        last_active_at: veryOldDate.toISOString(),
        respect_member_id: null,
      },
    ];

    mockFrom.mockReturnValue(queuedChain([{ data: users, error: null }]));

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dormant[0].daysSinceActive).toBeGreaterThan(360);
  });

  it('returns correct HTTP status 200 for successful request', async () => {
    mockFrom.mockReturnValue(queuedChain([{ data: [], error: null }]));

    const res = await GET(makeGetRequest('/api/admin/dormant'));
    expect(res.status).toBe(200);
  });
});
