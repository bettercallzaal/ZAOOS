import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAdminSession, mockAuthenticatedSession } from '@/test-utils/api-helpers';

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

import { GET } from '@/app/api/admin/member-health/route';

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
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Create a mock queue that returns chains in sequence.
 * Useful for testing multiple parallel queries that need different results.
 */
function createChainQueue(results: Array<{ data?: unknown; error?: unknown }>) {
  let callIndex = 0;
  return {
    mockFn: vi.fn(() => {
      if (callIndex >= results.length) {
        throw new Error(`Chain queue exhausted at call ${callIndex}`);
      }
      return chainMock(results[callIndex++]);
    }),
    getCallCount: () => callIndex,
  };
}

describe('GET /api/admin/member-health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 403 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin required');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin required');
  });

  it('passes authentication when isAdmin is true', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // users
      { data: [], error: null }, // respect_members
      { data: [], error: null }, // allowlist
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // ── Success path: basic structure ────────────────────────────────────────

  it('returns stats and issues array when queries succeed', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('issues');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  // ── Test stats aggregation ───────────────────────────────────────────────

  it('calculates correct totalUsers from users array', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 123, is_active: true, member_tier: 'community' },
      { id: 'u2', fid: 456, is_active: true, member_tier: 'community' },
      { id: 'u3', fid: 789, is_active: true, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.totalUsers).toBe(3);
  });

  it('counts respectHolders vs communityMembers by tier', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 123, member_tier: 'respect_holder' },
      { id: 'u2', fid: 456, member_tier: 'respect_holder' },
      { id: 'u3', fid: 789, member_tier: 'community' },
      { id: 'u4', fid: 101112, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.respectHolders).toBe(2);
    expect(body.stats.communityMembers).toBe(2);
  });

  it('counts totalRespectMembers from respect_members', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const respectMembers = [
      { id: 'r1', name: 'Alice', total_respect: 100 },
      { id: 'r2', name: 'Bob', total_respect: 200 },
      { id: 'r3', name: 'Charlie', total_respect: 150 },
    ];

    const queue = createChainQueue([
      { data: [], error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.totalRespectMembers).toBe(3);
  });

  it('counts missingZid correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 123, zid: 'z123', member_tier: 'community' },
      { id: 'u2', fid: 456, zid: null, member_tier: 'community' },
      { id: 'u3', fid: 789, zid: null, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.missingZid).toBe(2);
  });

  it('counts missingDiscord correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 123, discord_id: 'disc123', member_tier: 'community' },
      { id: 'u2', fid: 456, discord_id: null, member_tier: 'community' },
      { id: 'u3', fid: 789, discord_id: null, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.missingDiscord).toBe(2);
  });

  it('counts missingRealName correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 123, real_name: 'Alice Smith', member_tier: 'community' },
      { id: 'u2', fid: 456, real_name: null, member_tier: 'community' },
      { id: 'u3', fid: 789, real_name: null, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.missingRealName).toBe(2);
  });

  it('counts neverActive (no last_active_at)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 123, last_active_at: '2026-07-15T10:00:00Z', member_tier: 'community' },
      { id: 'u2', fid: 456, last_active_at: null, member_tier: 'community' },
      { id: 'u3', fid: 789, last_active_at: null, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.neverActive).toBe(2);
  });

  // ── Test issue detection: missing FID ────────────────────────────────────

  it('detects users with no FID as high severity', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: null, display_name: 'Alice', member_tier: 'community' }];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const fidIssue = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('No Farcaster FID linked');
    });
    expect(fidIssue).toBeDefined();
    expect(fidIssue.severity).toBe('high');
    expect(fidIssue.member).toBe('Alice');
  });

  it('uses primary_wallet as fallback for missing display_name in FID issue', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      {
        id: 'u1',
        fid: null,
        display_name: null,
        primary_wallet: '0x123',
        member_tier: 'community',
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const fidIssue = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('No Farcaster FID linked');
    });
    expect(fidIssue.member).toBe('0x123');
  });

  // ── Test issue detection: unlinked respect ──────────────────────────────

  it('detects respect members with no user link as medium severity', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      {
        id: 'u1',
        fid: 123,
        primary_wallet: '0xaaa',
        member_tier: 'community',
        respect_member_id: null,
        display_name: 'Bob',
      },
    ];

    const respectMembers = [
      {
        id: 'r1',
        name: 'Bob',
        fid: 123,
        wallet_address: '0xaaa',
        total_respect: 100,
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const unlinkedRespect = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('Respect data exists but not linked');
    });
    expect(unlinkedRespect).toBeDefined();
    expect(unlinkedRespect.severity).toBe('medium');
  });

  it('matches respect_member by FID when linking', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: 456, primary_wallet: '0xaaa', member_tier: 'community' }];

    const respectMembers = [
      { id: 'r1', name: 'Bob', fid: 456, wallet_address: '0xbbb', total_respect: 100 },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const unlinkedRespect = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('Respect data exists but not linked');
    });
    expect(unlinkedRespect).toBeDefined();
    expect(unlinkedRespect.fix).toContain('Link respect_member_id');
  });

  it('matches respect_member by wallet (case-insensitive)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: null, primary_wallet: '0xABC123', member_tier: 'community' }];

    const respectMembers = [
      {
        id: 'r1',
        name: 'Charlie',
        fid: 789,
        wallet_address: '0xabc123',
        total_respect: 100,
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const unlinkedRespect = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('Respect data exists but not linked');
    });
    expect(unlinkedRespect).toBeDefined();
  });

  // ── Test issue detection: respect without account ──────────────────────

  it('detects respect members with no ZAO account as medium', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users: unknown[] = [];

    const respectMembers = [
      { id: 'r1', name: 'David', fid: 999, wallet_address: '0xddd', total_respect: 100 },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const noAccount = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('Has');
    });
    expect(noAccount).toBeDefined();
    expect(noAccount.severity).toBe('medium');
  });

  it('ignores respect members with zero respect (no issue)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users: unknown[] = [];

    const respectMembers = [
      { id: 'r1', name: 'Eve', fid: 1000, wallet_address: '0xeee', total_respect: 0 },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const respectNoAcct = body.issues.filter((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('no ZAO OS account');
    });
    expect(respectNoAcct.length).toBe(0);
  });

  // ── Test issue detection: tier mismatch ──────────────────────────────────

  it('detects tier mismatch (community but has respect) as high severity', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: 123, member_tier: 'community', display_name: 'Frank' }];

    const respectMembers = [
      { id: 'r1', fid: 123, name: 'Frank', total_respect: 500, onchain_og: 10 },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const tierMismatch = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('tier is "community"');
    });
    expect(tierMismatch).toBeDefined();
    expect(tierMismatch.severity).toBe('high');
    expect(tierMismatch.fix).toContain('Update to respect_holder');
  });

  it('ignores tier mismatch when onchain_og/zor/respect are all 0/null', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: 123, member_tier: 'community', display_name: 'Grace' }];

    const respectMembers = [
      {
        id: 'r1',
        fid: 123,
        name: 'Grace',
        total_respect: 0,
        onchain_og: 0,
        onchain_zor: 0,
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const tierMismatch = body.issues.filter((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('tier is "community"');
    });
    expect(tierMismatch.length).toBe(0);
  });

  // ── Test issue detection: missing profile fields ──────────────────────

  it('detects users missing 3+ profile fields as low severity', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      {
        id: 'u1',
        fid: 123,
        member_tier: 'community',
        display_name: null,
        real_name: null,
        zid: null,
        discord_id: 'disc1',
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const missing = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('Missing:');
    });
    expect(missing).toBeDefined();
    expect(missing.severity).toBe('low');
    expect(missing.issue).toContain('display_name');
    expect(missing.issue).toContain('real_name');
    expect(missing.issue).toContain('zid');
  });

  it('ignores users missing 1-2 fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      {
        id: 'u1',
        fid: 123,
        member_tier: 'community',
        display_name: 'Henry',
        real_name: null,
        zid: 'z123',
        discord_id: 'disc1',
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const missing = body.issues.filter((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('Missing:');
    });
    expect(missing.length).toBe(0);
  });

  // ── Test issue detection: allowlist not logged in ──────────────────────

  it('detects allowlist entries with no user account as low severity', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users: unknown[] = [];

    const allowlist = [
      {
        id: 'a1',
        fid: 2000,
        wallet_address: '0xfff',
        real_name: 'Iris',
        is_active: true,
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: allowlist, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const allowlistNotLogged = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('On allowlist but never logged in');
    });
    expect(allowlistNotLogged).toBeDefined();
    expect(allowlistNotLogged.severity).toBe('low');
  });

  it('matches allowlist by FID when checking user account', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: 2000, primary_wallet: '0xaaa' }];

    const allowlist = [
      {
        id: 'a1',
        fid: 2000,
        wallet_address: '0xfff',
        real_name: 'Jack',
        is_active: true,
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: allowlist, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const allowlistNotLogged = body.issues.filter((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('On allowlist but never logged in');
    });
    expect(allowlistNotLogged.length).toBe(0);
  });

  it('matches allowlist by wallet (case-insensitive)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: null, primary_wallet: '0xJJJ' }];

    const allowlist = [
      {
        id: 'a1',
        fid: null,
        wallet_address: '0xjjj',
        real_name: 'Karen',
        is_active: true,
      },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: allowlist, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const allowlistNotLogged = body.issues.filter((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('On allowlist but never logged in');
    });
    expect(allowlistNotLogged.length).toBe(0);
  });

  // ── Test issue sorting ───────────────────────────────────────────────────

  it('sorts issues by severity: high, medium, low', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: null, member_tier: 'community', display_name: 'Low' }, // high (no fid)
      {
        id: 'u2',
        fid: 123,
        member_tier: 'community',
        display_name: null,
        real_name: null,
        zid: null,
        discord_id: null,
      }, // low (missing 3+)
    ];

    const respectMembers = [
      { id: 'r1', name: 'Med', fid: 999, total_respect: 100, onchain_og: 5 }, // medium (no account)
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // Should have at least 3 issues
    expect(body.issues.length).toBeGreaterThanOrEqual(2);

    // First issue should be high (no fid)
    const highIdx = body.issues.findIndex((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.severity === 'high';
    });
    expect(highIdx).toBeLessThan(body.issues.length);
  });

  // ── Test issue stats counts ──────────────────────────────────────────────

  it('counts issues by severity in stats', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: null, member_tier: 'community', display_name: 'Alice' }, // high
      { id: 'u2', fid: 456, member_tier: 'community', display_name: 'Bob' }, // medium (no match)
    ];

    const respectMembers = [
      { id: 'r1', name: 'Charlie', fid: 789, total_respect: 100 }, // medium (no account)
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.issueCount).toHaveProperty('high');
    expect(body.stats.issueCount).toHaveProperty('medium');
    expect(body.stats.issueCount).toHaveProperty('low');
    expect(body.stats.issueCount.high).toBeGreaterThanOrEqual(0);
    expect(body.stats.issueCount.medium).toBeGreaterThanOrEqual(0);
    expect(body.stats.issueCount.low).toBeGreaterThanOrEqual(0);
  });

  // ── Test null/undefined data handling ────────────────────────────────────

  it('handles null data arrays gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.stats.totalUsers).toBe(0);
    expect(body.stats.totalRespectMembers).toBe(0);
    expect(body.issues).toEqual([]);
  });

  it('handles empty data arrays', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.stats.totalUsers).toBe(0);
    expect(body.issues).toEqual([]);
  });

  // ── Test unlinked respect counting ───────────────────────────────────────

  it('calculates unlinkedRespect correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 100, primary_wallet: '0xaaa' },
      { id: 'u2', fid: 200, primary_wallet: '0xbbb' },
    ];

    const respectMembers = [
      { id: 'r1', fid: 100, wallet_address: '0xaaa' }, // linked
      { id: 'r2', fid: 300, wallet_address: '0xccc' }, // unlinked
      { id: 'r3', fid: 400, wallet_address: '0xddd' }, // unlinked
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.unlinkedRespect).toBe(2);
  });

  // ── Test allowlistNotLoggedIn counting ───────────────────────────────────

  it('calculates allowlistNotLoggedIn correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: 100, primary_wallet: '0xaaa' }];

    const allowlist = [
      { id: 'a1', fid: 100, wallet_address: '0xaaa' }, // logged in
      { id: 'a2', fid: 200, wallet_address: '0xbbb' }, // not logged in
      { id: 'a3', fid: 300, wallet_address: '0xccc' }, // not logged in
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: allowlist, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.allowlistNotLoggedIn).toBe(2);
  });

  // ── Error path: exception thrown ──────────────────────────────────────────

  it('returns 500 and logs when Supabase query throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('DB connection lost');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed');
  });

  it('logs errors to logger.error', async () => {
    const { logger } = await import('@/lib/logger');
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('DB connection lost');
    });

    await GET();

    expect(logger.error).toHaveBeenCalled();
  });

  // ── Edge cases: complex data ─────────────────────────────────────────────

  it('handles user with no display_name, username, or wallet', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: null, display_name: null, primary_wallet: null, member_tier: 'community' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // Should create an issue with fallback to 'id'
    const fidIssue = body.issues.find((i: unknown) => {
      const issue = i as Record<string, unknown>;
      return issue.issue?.includes('No Farcaster FID linked');
    });
    expect(fidIssue).toBeDefined();
  });

  it('handles respect_member with no total_respect', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users: unknown[] = [];

    const respectMembers = [
      { id: 'r1', name: 'Leo', fid: 500, wallet_address: '0xeee', total_respect: null },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    // No issue should be created for null total_respect (treated as 0)
  });

  it('handles complex mix of linked and unlinked records', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [
      { id: 'u1', fid: 1, primary_wallet: '0xaaa', member_tier: 'respect_holder' },
      { id: 'u2', fid: 2, primary_wallet: '0xbbb', member_tier: 'community' },
      { id: 'u3', fid: null, primary_wallet: '0xccc', member_tier: 'community' },
    ];

    const respectMembers = [
      { id: 'r1', fid: 1, wallet_address: '0xaaa', total_respect: 100, onchain_og: 0 },
      { id: 'r2', fid: 2, wallet_address: '0xbbb', total_respect: 50, onchain_og: 5 },
      { id: 'r3', fid: 99, wallet_address: '0xzzz', total_respect: 200, onchain_og: 0 },
    ];

    const allowlist = [
      { id: 'a1', fid: 1, wallet_address: '0xaaa' },
      { id: 'a2', fid: 999, wallet_address: '0xyyy' },
    ];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: respectMembers, error: null },
      { data: allowlist, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Complex scenario: multiple issues should be detected
    expect(body.issues.length).toBeGreaterThan(0);
    expect(body.stats.totalUsers).toBe(3);
    expect(body.stats.totalRespectMembers).toBe(3);
  });

  // ── Test response shape consistency ──────────────────────────────────────

  it('returns response with exact expected shape', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['issues', 'stats'].sort());
    expect(Object.keys(body.stats).sort()).toEqual(
      [
        'allowlistNotLoggedIn',
        'communityMembers',
        'issueCount',
        'missingDiscord',
        'missingRealName',
        'missingZid',
        'neverActive',
        'respectHolders',
        'totalRespectMembers',
        'totalUsers',
        'unlinkedRespect',
      ].sort(),
    );
  });

  it('each issue has required fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const users = [{ id: 'u1', fid: null, member_tier: 'community', display_name: 'Test' }];

    const queue = createChainQueue([
      { data: users, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.issues.length).toBeGreaterThan(0);
    for (const issue of body.issues) {
      expect(issue).toHaveProperty('severity');
      expect(issue).toHaveProperty('member');
      expect(issue).toHaveProperty('issue');
      expect(['high', 'medium', 'low']).toContain(issue.severity);
    }
  });
});
