import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

// FIFO chain: queries pop results from a queue in order.
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'not',
    'is',
    'single',
    'order',
    'limit',
    'like',
    'maybeSingle',
  ]) {
    chain[m] = vi.fn(() => chain);
  }

  // Terminal method .single() returns a promise that resolves to the next queued result
  chain.single = vi.fn(() => Promise.resolve(q.shift() ?? { data: null, error: null }));

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift() ?? { data: null, error: null });

  return chain;
}

// Create a Supabase mock that returns new FIFO chains on each from() call
function createSupabaseMock(results: Array<{ data?: unknown; error?: unknown }>[]) {
  let callIndex = 0;
  return {
    from: () => {
      const chainResults = results[callIndex] || [];
      callIndex++;
      return queuedChain([...chainResults]);
    },
  };
}

const { mockGetSupabaseAdmin, mockGetFollowers, mockGetUsersByFids, mockGetEngagementScores } =
  vi.hoisted(() => ({
    mockGetSupabaseAdmin: vi.fn(),
    mockGetFollowers: vi.fn(),
    mockGetUsersByFids: vi.fn(),
    mockGetEngagementScores: vi.fn(),
  }));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((...args: unknown[]) => {
      const mock = mockGetSupabaseAdmin();
      return mock.from?.(...args);
    }),
  },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getFollowers: (...args: unknown[]) => mockGetFollowers(...args),
  getUsersByFids: (...args: unknown[]) => mockGetUsersByFids(...args),
}));

vi.mock('@/lib/openrank/client', () => ({
  getEngagementScores: (...args: unknown[]) => mockGetEngagementScores(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/cron/follower-snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- AUTH TESTS ----

  it('returns 500 when CRON_SECRET is not set', async () => {
    const originalSecret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    try {
      const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
      req.headers.set('authorization', 'Bearer any-value');
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('CRON_SECRET not configured');
    } finally {
      if (originalSecret) process.env.CRON_SECRET = originalSecret;
    }
  });

  it('returns 401 when Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'test-secret-key';
    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    // No authorization header
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header value does not match CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'test-secret-key';
    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer wrong-secret');
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('accepts request with correct Bearer token', async () => {
    process.env.CRON_SECRET = 'test-secret-key';
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [], error: null }], // members query
      ]),
    );

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    // Should proceed past auth and return 200 for empty members
    expect(res.status).toBe(200);
  });

  // ---- MEMBERS QUERY TESTS ----

  it('returns 500 when members query fails', async () => {
    process.env.CRON_SECRET = 'test-secret-key';
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: null, error: { message: 'DB connection error' } }], // members query fails
      ]),
    );

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch members');
  });

  it('returns 200 with zero members when members table is empty', async () => {
    process.env.CRON_SECRET = 'test-secret-key';
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [], error: null }], // empty members
      ]),
    );

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(0);
    expect(json.newUnfollows).toBe(0);
    expect(json.errors).toEqual([]);
  });

  // ---- HAPPY PATH: SINGLE MEMBER ----

  it('successfully snapshots a single member with no unfollows', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;

    // Mock getFollowers to return followers in one page
    mockGetFollowers.mockResolvedValue({
      users: [{ user: { fid: 100 } }, { user: { fid: 101 } }, { user: { fid: 102 } }],
      next: undefined,
    });

    // Mock getUsersByFids for member profile (following_count)
    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    // Mock Supabase queries in order:
    // 1. SELECT members
    // 2. UPSERT follower_snapshots
    // 3. UPSERT member_stats_history
    // 4. SELECT yesterday's snapshot (none found)
    // 5. POST engagement scores update (will fail gracefully)
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: null, error: null }], // select yesterday's snapshot
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map()); // no scores

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);
    expect(json.newUnfollows).toBe(0);
    expect(json.errors).toEqual([]);

    // Verify getFollowers was called with correct params
    expect(mockGetFollowers).toHaveBeenCalledWith(
      memberId,
      undefined,
      'desc_chron',
      undefined,
      100,
    );

    // Verify getUsersByFids was called to get member profile
    expect(mockGetUsersByFids).toHaveBeenCalledWith([memberId]);
  });

  // ---- UNFOLLOW DETECTION ----

  it('detects and records unfollows from previous snapshot', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;
    const yesterdayFollowers = [100, 101, 102, 103]; // 103 will unfollow
    const todayFollowers = [100, 101, 102]; // 103 is gone

    mockGetFollowers.mockResolvedValue({
      users: todayFollowers.map((fid) => ({ user: { fid } })),
      next: undefined,
    });

    mockGetUsersByFids
      .mockResolvedValueOnce([{ fid: memberId, following_count: 50 }]) // member profile
      .mockResolvedValueOnce([
        // unfollower batch
        { fid: 103, username: 'unfollower', display_name: 'Unfollower User' },
      ]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: { follower_fids: yesterdayFollowers }, error: null }], // select yesterday's snapshot
        [{ data: null, error: null }], // insert unfollow_events
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map());

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);
    expect(json.newUnfollows).toBe(1); // 1 unfollow detected
    expect(json.errors).toEqual([]);
  });

  // ---- FOLLOWER PAGINATION ----

  it('paginates through followers across multiple pages', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;
    const page1Followers = [100, 101];
    const page2Followers = [102, 103];

    mockGetFollowers
      .mockResolvedValueOnce({
        users: page1Followers.map((fid) => ({ user: { fid } })),
        next: { cursor: 'page2-cursor' },
      })
      .mockResolvedValueOnce({
        users: page2Followers.map((fid) => ({ user: { fid } })),
        next: undefined,
      });

    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: null, error: null }], // select yesterday's snapshot
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map());

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);

    // Verify pagination calls
    expect(mockGetFollowers).toHaveBeenCalledTimes(2);
    expect(mockGetFollowers).toHaveBeenNthCalledWith(
      1,
      memberId,
      undefined,
      'desc_chron',
      undefined,
      100,
    );
    expect(mockGetFollowers).toHaveBeenNthCalledWith(
      2,
      memberId,
      undefined,
      'desc_chron',
      'page2-cursor',
      100,
    );
  });

  // ---- ENGAGEMENT SCORES ----

  it('updates engagement scores when available', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;
    const engagementScore = 95.5;

    mockGetFollowers.mockResolvedValue({
      users: [{ user: { fid: 100 } }],
      next: undefined,
    });

    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: null, error: null }], // select yesterday's snapshot
        [{ data: null, error: null }], // update member_stats_history with engagement score
      ]),
    );

    const scoresMap = new Map([[memberId, engagementScore]]);
    mockGetEngagementScores.mockResolvedValue(scoresMap);

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);

    // Verify engagement scores were fetched for the member
    expect(mockGetEngagementScores).toHaveBeenCalledWith([memberId]);
  });

  // ---- ERROR HANDLING ----

  it('gracefully handles getFollowers error and continues', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;

    mockGetFollowers.mockRejectedValue(new Error('Neynar API error'));
    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
      ]),
    );

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(0); // Member processing failed
    expect(json.errors.length).toBe(1);
    expect(json.errors[0]).toContain('FID 12345');
    expect(json.errors[0]).toContain('Neynar API error');
  });

  it('handles Supabase upsert errors gracefully', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;

    mockGetFollowers.mockResolvedValue({
      users: [{ user: { fid: 100 } }],
      next: undefined,
    });

    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: { message: 'Snapshot upsert failed' } }], // follower_snapshots upsert fails
      ]),
    );

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(0);
    expect(json.errors.length).toBe(1);
  });

  it('handles OpenRank engagement scores fetch error gracefully (non-fatal)', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;

    mockGetFollowers.mockResolvedValue({
      users: [{ user: { fid: 100 } }],
      next: undefined,
    });

    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: null, error: null }], // select yesterday's snapshot
      ]),
    );

    mockGetEngagementScores.mockRejectedValue(new Error('OpenRank timeout'));

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    // Should still succeed despite engagement scores error
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);
  });

  // ---- MULTIPLE MEMBERS ----

  it('processes multiple members sequentially', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const member1 = 100;
    const member2 = 200;

    mockGetFollowers.mockResolvedValue({
      users: [{ user: { fid: 999 } }],
      next: undefined,
    });

    mockGetUsersByFids.mockResolvedValue([{ fid: 0, following_count: 50 }]);

    // Each member needs: members query (shared), followers upsert, stats upsert, yesterday check
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: member1 }, { fid: member2 }], error: null }], // members query
        [{ data: null, error: null }], // member1: upsert follower_snapshots
        [{ data: null, error: null }], // member1: upsert member_stats_history
        [{ data: null, error: null }], // member1: select yesterday
        [{ data: null, error: null }], // member2: upsert follower_snapshots
        [{ data: null, error: null }], // member2: upsert member_stats_history
        [{ data: null, error: null }], // member2: select yesterday
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map());

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(2);
  });

  // ---- UNFOLLOW BATCHING (>100 unfollowers) ----

  it('batches unfollower lookups in groups of 100', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;
    // Create 150 yesterday followers, 50 today — 100 unfollows
    const yesterdayFollowers = Array.from({ length: 150 }, (_, i) => i + 1);
    const todayFollowers = Array.from({ length: 50 }, (_, i) => i + 1);

    mockGetFollowers.mockResolvedValue({
      users: todayFollowers.map((fid) => ({ user: { fid } })),
      next: undefined,
    });

    mockGetUsersByFids
      .mockResolvedValueOnce([{ fid: memberId, following_count: 50 }]) // member profile
      .mockResolvedValueOnce(
        // batch 1: unfollowers 51-150 (100 users)
        Array.from({ length: 100 }, (_, i) => ({
          fid: 51 + i,
          username: `user${51 + i}`,
          display_name: `User ${51 + i}`,
        })),
      );

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: { follower_fids: yesterdayFollowers }, error: null }], // select yesterday
        [{ data: null, error: null }], // insert unfollow_events
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map());

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);
    expect(json.newUnfollows).toBe(100);
  });

  // ---- EDGE CASE: empty following_count fallback ----

  it('handles missing following_count from user profile', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;

    mockGetFollowers.mockResolvedValue({
      users: [{ user: { fid: 100 } }],
      next: undefined,
    });

    // Return user without following_count
    mockGetUsersByFids.mockResolvedValue([{ fid: memberId }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: null, error: null }], // select yesterday
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map());

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);
  });

  // ---- FOLLOWER FID EXTRACTION (Neynar response format) ----

  it('extracts FID from both user.fid and direct fid fields', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    const memberId = 12345;

    // Some entries have { user: { fid: X } }, others might have direct fid
    mockGetFollowers.mockResolvedValue({
      users: [
        { user: { fid: 100 } }, // standard format
        { fid: 101 }, // direct fid fallback
      ],
      next: undefined,
    });

    mockGetUsersByFids.mockResolvedValue([{ fid: memberId, following_count: 50 }]);

    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: [{ fid: memberId }], error: null }], // members query
        [{ data: null, error: null }], // upsert follower_snapshots
        [{ data: null, error: null }], // upsert member_stats_history
        [{ data: null, error: null }], // select yesterday
      ]),
    );

    mockGetEngagementScores.mockResolvedValue(new Map());

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.membersProcessed).toBe(1);
  });

  it('handles caught errors in outer try-catch returning 500', async () => {
    process.env.CRON_SECRET = 'test-secret-key';

    // Mock members query to throw an unexpected error
    mockGetSupabaseAdmin.mockReturnValue({
      from: () => {
        throw new Error('Unexpected database error');
      },
    });

    const req = makeRequest('/api/cron/follower-snapshot', { method: 'GET' });
    req.headers.set('authorization', 'Bearer test-secret-key');
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });
});
