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

import { GET } from '@/app/api/admin/onboarding-funnel/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query.
 * Includes all methods used by onboarding-funnel: select, eq, gt, not, is
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gt = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Create a mock queue that returns chains in sequence for Promise.allSettled.
 * Useful for testing multiple parallel queries that need different results.
 */
function createChainQueue(
  results: Array<{ data?: unknown; error?: unknown; count?: number | null }>,
) {
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

describe('GET /api/admin/onboarding-funnel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  it('passes authentication when isAdmin is true', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null }, // allowlisted
      { count: 80, error: null }, // walletConnected
      { count: 70, error: null }, // fidLinked
      { count: 60, error: null }, // inRespectDb
      { count: 40, error: null }, // attendedFractal
      { count: 30, error: null }, // earnedRespect
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(queue.getCallCount()).toBe(6);
  });

  // ── Success path: all funnel stages aggregated correctly ─────────────────────

  it('returns correct funnel stages when all queries succeed', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 188, error: null }, // Allowlisted
      { count: 160, error: null }, // Wallet Connected
      { count: 150, error: null }, // FID Linked
      { count: 120, error: null }, // In Respect DB
      { count: 80, error: null }, // Attended Fractal
      { count: 50, error: null }, // Earned Respect
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.stages).toBeDefined();
    expect(body.stages).toHaveLength(6);

    // Verify exact stage structure and order
    expect(body.stages[0]).toEqual({
      stage: 'Allowlisted',
      count: 188,
      description: 'Invited to join ZAO OS',
    });
    expect(body.stages[1]).toEqual({
      stage: 'Wallet Connected',
      count: 160,
      description: 'Connected wallet and signed in',
    });
    expect(body.stages[2]).toEqual({
      stage: 'FID Linked',
      count: 150,
      description: 'Linked Farcaster account',
    });
    expect(body.stages[3]).toEqual({
      stage: 'In Respect DB',
      count: 120,
      description: 'Added to Respect system',
    });
    expect(body.stages[4]).toEqual({
      stage: 'Attended Fractal',
      count: 80,
      description: 'Participated in at least one fractal',
    });
    expect(body.stages[5]).toEqual({
      stage: 'Earned Respect',
      count: 50,
      description: 'Earned Respect from the community',
    });
  });

  // ── Test individual stage counts ──────────────────────────────────────────

  it('returns count for Allowlisted stage from allowlist table', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 250, error: null }, // Allowlisted
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[0].stage).toBe('Allowlisted');
    expect(body.stages[0].count).toBe(250);
  });

  it('returns count for Wallet Connected stage from users table', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 95, error: null }, // Wallet Connected
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[1].stage).toBe('Wallet Connected');
    expect(body.stages[1].count).toBe(95);
  });

  it('returns count for FID Linked stage filtering on not fid is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 75, error: null }, // FID Linked
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[2].stage).toBe('FID Linked');
    expect(body.stages[2].count).toBe(75);
  });

  it('returns count for In Respect DB stage from respect_members', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null }, // In Respect DB
      { count: 0, error: null },
      { count: 0, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[3].stage).toBe('In Respect DB');
    expect(body.stages[3].count).toBe(70);
  });

  it('returns count for Attended Fractal filtering gt fractal_count', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 45, error: null }, // Attended Fractal (gt fractal_count 0)
      { count: 0, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[4].stage).toBe('Attended Fractal');
    expect(body.stages[4].count).toBe(45);
  });

  it('returns count for Earned Respect filtering gt total_respect', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 45, error: null },
      { count: 25, error: null }, // Earned Respect (gt total_respect 0)
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[5].stage).toBe('Earned Respect');
    expect(body.stages[5].count).toBe(25);
  });

  // ── Test null count handling ──────────────────────────────────────────────

  it('treats null counts as 0', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: null, error: null }, // Allowlisted null
      { count: null, error: null },
      { count: null, error: null },
      { count: null, error: null },
      { count: null, error: null },
      { count: null, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[0].count).toBe(0);
    expect(body.stages[1].count).toBe(0);
    expect(body.stages[2].count).toBe(0);
    expect(body.stages[3].count).toBe(0);
    expect(body.stages[4].count).toBe(0);
    expect(body.stages[5].count).toBe(0);
  });

  // ── Test Supabase query chain methods ─────────────────────────────────────

  it('calls allowlist table with is_active eq true filter', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    const chains: Record<number, ReturnType<typeof chainMock>> = {};
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      const result = queue.mockFn();
      chains[callCount] = result as ReturnType<typeof chainMock>;
      callCount++;
      return result;
    });

    await GET();

    // First chain should be from('allowlist')
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'allowlist');
    const allowlistChain = chains[0];
    if (allowlistChain?.eq) {
      expect(allowlistChain.eq).toHaveBeenCalledWith('is_active', true);
    }
  });

  it('calls users table with is_active eq true filter for wallet connected', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    const chains: Record<number, ReturnType<typeof chainMock>> = {};
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      const result = queue.mockFn();
      chains[callCount] = result as ReturnType<typeof chainMock>;
      callCount++;
      return result;
    });

    await GET();

    // Second chain should be from('users')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'users');
    const walletChain = chains[1];
    if (walletChain?.eq) {
      expect(walletChain.eq).toHaveBeenCalledWith('is_active', true);
    }
  });

  it('calls users table with not fid is null filter for fid linked', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    const chains: Record<number, ReturnType<typeof chainMock>> = {};
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      const result = queue.mockFn();
      chains[callCount] = result as ReturnType<typeof chainMock>;
      callCount++;
      return result;
    });

    await GET();

    // Third chain should be from('users') with not fid is null
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'users');
    const fidChain = chains[2];
    if (fidChain?.not) {
      expect(fidChain.not).toHaveBeenCalledWith('fid', 'is', null);
    }
  });

  it('calls respect_members table for in respect db', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    await GET();

    // Fourth call should be from('respect_members')
    expect(mockFrom).toHaveBeenNthCalledWith(4, 'respect_members');
  });

  it('calls respect_members with gt fractal_count filter', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    const chains: Record<number, ReturnType<typeof chainMock>> = {};
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      const result = queue.mockFn();
      chains[callCount] = result as ReturnType<typeof chainMock>;
      callCount++;
      return result;
    });

    await GET();

    // Fifth chain (Attended Fractal) should have gt called
    const fractalChain = chains[4];
    if (fractalChain?.gt) {
      expect(fractalChain.gt).toHaveBeenCalledWith('fractal_count', 0);
    }
  });

  it('calls respect_members with gt total_respect filter', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    const chains: Record<number, ReturnType<typeof chainMock>> = {};
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      const result = queue.mockFn();
      chains[callCount] = result as ReturnType<typeof chainMock>;
      callCount++;
      return result;
    });

    await GET();

    // Sixth chain (Earned Respect) should have gt called
    const respectChain = chains[5];
    if (respectChain?.gt) {
      expect(respectChain.gt).toHaveBeenCalledWith('total_respect', 0);
    }
  });

  // ── Test error handling in Promise.allSettled ─────────────────────────────

  it('continues processing when one query has error in response', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: 'Permission denied' }, // FID Linked returns error
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    // Should return 200 because Promise.allSettled handles both fulfilled and rejected
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stages).toBeDefined();
    // The error response is treated as 0 count
    expect(body.stages[2].count).toBe(0);
  });

  it('treats failed promise as 0 count via extractCount logic', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: 'DB error' }, // FID Linked fails
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // extractCount should return 0 when error is present
    expect(body.stages[2].count).toBe(0);
  });

  // ── Test error path: exception thrown ────────────────────────────────────

  it('returns 500 when exception thrown in handler', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected DB error');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load onboarding funnel data');
  });

  it('logs errors to logger.error on exception', async () => {
    const { logger } = await import('@/lib/logger');
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected DB error');
    });

    await GET();

    expect(logger.error).toHaveBeenCalled();
    const calls = vi.mocked(logger.error).mock.calls;
    expect(calls[0][0]).toContain('[onboarding-funnel]');
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('returns all zeros when zero members exist', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[0].count).toBe(0);
    expect(body.stages[1].count).toBe(0);
    expect(body.stages[2].count).toBe(0);
    expect(body.stages[3].count).toBe(0);
    expect(body.stages[4].count).toBe(0);
    expect(body.stages[5].count).toBe(0);
  });

  it('handles conversion rates decreasing naturally down the funnel', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 1000, error: null }, // Allowlisted
      { count: 900, error: null }, // Wallet Connected (90%)
      { count: 750, error: null }, // FID Linked (75%)
      { count: 500, error: null }, // In Respect DB (50%)
      { count: 250, error: null }, // Attended Fractal (25%)
      { count: 100, error: null }, // Earned Respect (10%)
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // Verify strict funnel pattern (each stage <= previous)
    expect(body.stages[0].count).toBe(1000);
    expect(body.stages[1].count).toBe(900);
    expect(body.stages[2].count).toBe(750);
    expect(body.stages[3].count).toBe(500);
    expect(body.stages[4].count).toBe(250);
    expect(body.stages[5].count).toBe(100);
  });

  it('handles inconsistency where later stage > earlier stage (data bug)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null }, // Allowlisted
      { count: 200, error: null }, // Wallet Connected > Allowlisted (inconsistent)
      { count: 50, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
      { count: 20, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // Route returns the counts as-is (no validation)
    expect(body.stages[0].count).toBe(100);
    expect(body.stages[1].count).toBe(200);
  });

  it('handles very large counts', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 10000000, error: null }, // Allowlisted
      { count: 9000000, error: null },
      { count: 8000000, error: null },
      { count: 7000000, error: null },
      { count: 5000000, error: null },
      { count: 2000000, error: null }, // Earned Respect
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stages[0].count).toBe(10000000);
    expect(body.stages[5].count).toBe(2000000);
  });

  // ── Response shape validation ────────────────────────────────────────────

  it('returns response with exact required fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // Response should have stages array
    expect(Array.isArray(body.stages)).toBe(true);

    // Each stage object should have exactly: stage, count, description
    for (const stage of body.stages) {
      expect(Object.keys(stage).sort()).toEqual(['count', 'description', 'stage'].sort());
    }
  });

  it('uses Promise.allSettled to execute all 6 queries in parallel', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const startTime = Date.now();
    const res = await GET();
    const endTime = Date.now();

    // All 6 queries should have been called (they were awaited in Promise.allSettled)
    expect(queue.getCallCount()).toBe(6);
    expect(res.status).toBe(200);

    // Execution time should be very fast since we're not hitting real DB
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('stages are in correct order: Allowlisted → Earned Respect', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { count: 100, error: null },
      { count: 90, error: null },
      { count: 80, error: null },
      { count: 70, error: null },
      { count: 40, error: null },
      { count: 30, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    const stageNames = body.stages.map((s: { stage: string }) => s.stage);
    expect(stageNames).toEqual([
      'Allowlisted',
      'Wallet Connected',
      'FID Linked',
      'In Respect DB',
      'Attended Fractal',
      'Earned Respect',
    ]);
  });
});
