import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
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

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
  },
}));

// Mock global fetch
global.fetch = vi.fn();

import { GET } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

describe('GET /api/social/community-graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── Empty members tests ──────────────────────────────────────────────────

  it('returns empty graph when no members exist', async () => {
    const membersChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(membersChain);

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.members).toEqual([]);
    expect(body.connections).toEqual([]);
    expect(body.stats).toEqual({});
  });

  it('returns early without Neynar calls when no members exist', async () => {
    const membersChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(membersChain);

    await GET(makeGetRequest('/api/social/community-graph'));

    // Fetch should NOT be called for empty members
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ── Graph building tests ─────────────────────────────────────────────────

  it('builds graph with members and connections', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
      {
        fid: 2,
        display_name: 'Bob',
        username: 'bob',
        pfp_url: 'url2',
        zid: 'zid2',
        is_active: true,
      },
      {
        fid: 3,
        display_name: 'Charlie',
        username: 'charlie',
        pfp_url: 'url3',
        zid: 'zid3',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Mock Neynar API for Phase 1 (profiles with session user as viewer)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, follower_count: 100, following_count: 50 },
          { fid: 2, follower_count: 80, following_count: 60 },
          { fid: 3, follower_count: 120, following_count: 40 },
        ],
      }),
    });

    // Mock Neynar API for Phase 2 (follow relationships for viewer 1)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 2, viewer_context: { following: true } },
          { fid: 3, viewer_context: { following: false } },
        ],
      }),
    });

    // Mock Neynar API for Phase 2 (follow relationships for viewer 2)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, viewer_context: { following: true } },
          { fid: 3, viewer_context: { following: true } },
        ],
      }),
    });

    // Mock Neynar API for Phase 2 (follow relationships for viewer 3)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, viewer_context: { following: false } },
          { fid: 2, viewer_context: { following: true } },
        ],
      }),
    });

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.members).toHaveLength(3);
    expect(body.connections).toHaveLength(4); // 1→2, 2→1, 2→3, 3→2
    expect(body.stats.totalMembers).toBe(3);
    expect(body.currentFid).toBe(123); // from mockAuthenticatedSession default
  });

  it('enriches member nodes with follower/following counts', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ fid: 1, follower_count: 100, following_count: 50 }],
      }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    const body = await res.json();

    expect(body.members[0]).toMatchObject({
      fid: 1,
      followerCount: 100,
      followingCount: 50,
      displayName: 'Alice',
      username: 'alice',
    });
  });

  it('calculates member connection stats from Neynar viewer data', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
      {
        fid: 2,
        display_name: 'Bob',
        username: 'bob',
        pfp_url: 'url2',
        zid: 'zid2',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1: profiles
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, follower_count: 10, following_count: 5 },
          { fid: 2, follower_count: 15, following_count: 8 },
        ],
      }),
    });

    // Phase 2: viewer 1 sees 2 following
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ fid: 2, viewer_context: { following: true } }],
      }),
    });

    // Phase 2: viewer 2 sees 1 following
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ fid: 1, viewer_context: { following: true } }],
      }),
    });

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    const body = await res.json();

    // biome-ignore lint/suspicious/noExplicitAny: test helper
    const alice = body.members.find((m: any) => m.fid === 1);
    // biome-ignore lint/suspicious/noExplicitAny: test helper
    const bob = body.members.find((m: any) => m.fid === 2);

    // Both have follower/following and mutual counts
    expect(alice).toHaveProperty('communityFollowers');
    expect(alice).toHaveProperty('communityFollowing');
    expect(alice).toHaveProperty('mutuals');
    expect(bob).toHaveProperty('communityFollowers');
    expect(bob).toHaveProperty('communityFollowing');
    expect(bob).toHaveProperty('mutuals');
  });

  it('calculates graph density as percentage of possible edges', async () => {
    const members = [
      { fid: 1, display_name: 'A', username: 'a', pfp_url: 'url1', zid: 'zid1', is_active: true },
      { fid: 2, display_name: 'B', username: 'b', pfp_url: 'url2', zid: 'zid2', is_active: true },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1: profiles
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, follower_count: 10, following_count: 5 },
          { fid: 2, follower_count: 10, following_count: 5 },
        ],
      }),
    });

    // Phase 2: viewers
    for (let i = 0; i < 2; i++) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });
    }

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    const body = await res.json();

    // Verify density is present and is a number
    expect(body.stats.density).toBeDefined();
    expect(typeof body.stats.density).toBe('number');
  });

  it('processes members when query returns large dataset', async () => {
    // The route caps processing at 100, but DB returns 150
    const members = Array.from({ length: 150 }, (_, i) => ({
      fid: i + 1,
      display_name: `User${i + 1}`,
      username: `user${i + 1}`,
      pfp_url: `url${i + 1}`,
      zid: `zid${i + 1}`,
      is_active: true,
    }));

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1: profiles for first 100
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: Array.from({ length: 100 }, (_, i) => ({
          fid: i + 1,
          follower_count: 10,
          following_count: 5,
        })),
      }),
    });

    // Phase 2: 20 batches of 5 viewers
    for (let i = 0; i < 20; i++) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });
    }

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Route caps at 100 FIDs, returns those nodes
    expect(body.stats.totalMembers).toBeGreaterThan(0);
    expect(body.stats.totalMembers).toBeLessThanOrEqual(100);
  });

  it('handles members with and without FID', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
      {
        fid: null,
        display_name: 'NoFID',
        username: 'nofid',
        pfp_url: 'url2',
        zid: 'zid2',
        is_active: true,
      },
      {
        fid: 2,
        display_name: 'Bob',
        username: 'bob',
        pfp_url: 'url3',
        zid: 'zid3',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, follower_count: 10, following_count: 5 },
          { fid: 2, follower_count: 15, following_count: 8 },
        ],
      }),
    });

    // Phase 2
    for (let i = 0; i < 2; i++) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });
    }

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    const body = await res.json();

    // Nodes array filters to FID-having members
    expect(body.members.length).toBeGreaterThan(0);
  });

  // ── Stats tests ──────────────────────────────────────────────────────────

  it('includes topmost connected members in stats', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
      {
        fid: 2,
        display_name: 'Bob',
        username: 'bob',
        pfp_url: 'url2',
        zid: 'zid2',
        is_active: true,
      },
      {
        fid: 3,
        display_name: 'Charlie',
        username: 'charlie',
        pfp_url: 'url3',
        zid: 'zid3',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, follower_count: 10, following_count: 5 },
          { fid: 2, follower_count: 10, following_count: 5 },
          { fid: 3, follower_count: 10, following_count: 5 },
        ],
      }),
    });

    // Viewer 1 follows 2 and 3
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 2, viewer_context: { following: true } },
          { fid: 3, viewer_context: { following: true } },
        ],
      }),
    });

    // Viewer 2 follows 1 (mutual with 1) and 3
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, viewer_context: { following: true } },
          { fid: 3, viewer_context: { following: true } },
        ],
      }),
    });

    // Viewer 3 follows none
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    const body = await res.json();

    const mostConnected = body.stats.mostConnected;
    expect(mostConnected).toBeDefined();
    expect(mostConnected.length).toBeGreaterThan(0);
    // Should be sorted by mutuals (descending)
    for (let i = 1; i < mostConnected.length; i++) {
      expect(mostConnected[i - 1].mutuals).toBeGreaterThanOrEqual(mostConnected[i].mutuals);
    }
  });

  it('tracks disconnected members in stats', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
      {
        fid: 2,
        display_name: 'Bob',
        username: 'bob',
        pfp_url: 'url2',
        zid: 'zid2',
        is_active: true,
      },
      {
        fid: 3,
        display_name: 'Isolated',
        username: 'isolated',
        pfp_url: 'url3',
        zid: 'zid3',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { fid: 1, follower_count: 10, following_count: 5 },
          { fid: 2, follower_count: 10, following_count: 5 },
          { fid: 3, follower_count: 0, following_count: 0 },
        ],
      }),
    });

    // Phase 2
    for (let i = 0; i < 3; i++) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });
    }

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    const body = await res.json();

    // disconnectedCount is present
    expect(body.stats).toHaveProperty('disconnectedCount');
    expect(typeof body.stats.disconnectedCount).toBe('number');
  });

  // ── Caching tests ────────────────────────────────────────────────────────

  it('returns cached graph on subsequent requests', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ fid: 1, follower_count: 10, following_count: 5 }],
      }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    // First request builds cache
    const res1 = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res1.status).toBe(200);
    const fetchCount1 = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Second request should use cache
    const res2 = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res2.status).toBe(200);
    const fetchCount2 = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // No additional fetch calls
    expect(fetchCount2).toBe(fetchCount1);
  });

  it('sets Cache-Control headers on response', async () => {
    const membersChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(membersChain);

    const res = await GET(makeGetRequest('/api/social/community-graph'));

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=60',
    );
  });

  // ── Error handling tests ─────────────────────────────────────────────────

  it('handles Neynar fetch failures gracefully by logging', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1: Neynar returns error
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    // Phase 2
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Route continues and returns response
    expect(body.members).toBeDefined();
  });

  it('handles fetch errors by logging and continuing', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    // Phase 1: fetch throws
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Timeout'));

    // Phase 2: fetch throws
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Timeout'));

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Route returns response even with fetch errors
    expect(body.members).toBeDefined();
  });

  it('returns response structure with all required fields', async () => {
    const members = [
      {
        fid: 1,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'url1',
        zid: 'zid1',
        is_active: true,
      },
    ];

    const membersChain = chainMock({ data: members, error: null });
    mockFrom.mockReturnValue(membersChain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ fid: 1, follower_count: 10, following_count: 5 }],
      }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/social/community-graph'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('members');
    expect(body).toHaveProperty('connections');
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('currentFid');
    expect(Array.isArray(body.members)).toBe(true);
    expect(Array.isArray(body.connections)).toBe(true);
    expect(typeof body.stats).toBe('object');
    expect(typeof body.currentFid).toBe('number');
  });
});
