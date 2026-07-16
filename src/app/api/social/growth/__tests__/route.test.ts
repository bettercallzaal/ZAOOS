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
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

describe('GET /api/social/growth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── FID parameter validation tests ────────────────────────────────────────

  it('uses session fid when no fid param provided', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fid).toBe(123); // session fid
  });

  it('uses provided fid when param is valid', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '999' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fid).toBe(999);
  });

  it('returns 400 when fid is negative', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '-1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('returns 400 when fid is zero', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('returns 400 when fid is not an integer', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '123.45' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('returns 400 when fid is non-numeric', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { fid: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('returns 400 when session has no fid and none provided', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' }); // no fid
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No Farcaster account linked');
  });

  // ── Days parameter validation tests ──────────────────────────────────────

  it('defaults to 30 days when no days param provided', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toBe(30);
  });

  it('uses provided days when param is valid', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { days: '90' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toBe(90);
  });

  it('accepts max days value of 365', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { days: '365' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toBe(365);
  });

  it('returns 400 when days exceeds max of 365', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { days: '366' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid days parameter (1-365)');
  });

  it('returns 400 when days is zero', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { days: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid days parameter (1-365)');
  });

  it('returns 400 when days is negative', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { days: '-30' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid days parameter (1-365)');
  });

  it('returns 400 when days is not an integer', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { days: '30.5' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid days parameter (1-365)');
  });

  it('returns 400 when days is non-numeric', async () => {
    const res = await GET(makeGetRequest('/api/social/growth', { days: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid days parameter (1-365)');
  });

  // ── Supabase query tests ─────────────────────────────────────────────────

  it('queries member_stats_history with correct select', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/social/growth'));
    expect(mockFrom).toHaveBeenCalledWith('member_stats_history');
    expect(chain.select).toHaveBeenCalledWith(
      'snapshot_date, follower_count, following_count, engagement_score',
    );
  });

  it('filters by fid', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/social/growth', { fid: '999' }));
    expect(chain.eq).toHaveBeenCalledWith('fid', 999);
  });

  it('filters by start date using gte', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/social/growth', { days: '10' }));

    // Verify gte was called with a date string
    expect(chain.gte).toHaveBeenCalled();
    const gteCall = (chain.gte as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    expect(gteCall[0]).toBe('snapshot_date');
    expect(typeof gteCall[1]).toBe('string'); // ISO date string
    expect(gteCall[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
  });

  it('orders by snapshot_date ascending', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/social/growth'));
    expect(chain.order).toHaveBeenCalledWith('snapshot_date', { ascending: true });
  });

  // ── Response data transformation tests ────────────────────────────────────

  it('maps raw data to response history format', async () => {
    const rawData = [
      {
        snapshot_date: '2026-07-01',
        follower_count: 100,
        following_count: 50,
        engagement_score: 0.85,
      },
      {
        snapshot_date: '2026-07-02',
        follower_count: 105,
        following_count: 52,
        engagement_score: 0.87,
      },
    ];
    const chain = chainMock({ data: rawData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.history).toEqual([
      {
        date: '2026-07-01',
        followerCount: 100,
        followingCount: 50,
        engagementScore: 0.85,
      },
      {
        date: '2026-07-02',
        followerCount: 105,
        followingCount: 52,
        engagementScore: 0.87,
      },
    ]);
  });

  it('returns empty history when no data', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.history).toEqual([]);
  });

  it('returns null data as empty history', async () => {
    const chain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.history).toEqual([]);
  });

  it('includes fid and days in response', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '555', days: '60' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fid).toBe(555);
    expect(body.days).toBe(60);
  });

  // ── Cache header tests ───────────────────────────────────────────────────

  it('sets cache control headers on success', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=30',
    );
  });

  // ── Error handling tests ─────────────────────────────────────────────────

  it('returns 500 when supabase query errors', async () => {
    const chain = chainMock({ data: null, error: new Error('db connection failed') });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch growth data');
  });

  it('logs error when supabase query fails', async () => {
    const { logger } = await import('@/lib/logger');
    const chain = chainMock({ data: null, error: { message: 'db error' } });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/social/growth'));
    expect(logger.error).toHaveBeenCalledWith(
      'Growth query error:',
      expect.objectContaining({ message: 'db error' }),
    );
  });

  it('returns 500 when an unexpected exception is thrown', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('logs exception when one is thrown', async () => {
    const { logger } = await import('@/lib/logger');
    const testError = new Error('Unexpected error');
    mockFrom.mockImplementation(() => {
      throw testError;
    });
    await GET(makeGetRequest('/api/social/growth'));
    expect(logger.error).toHaveBeenCalledWith('Growth route error:', testError);
  });

  // ── Combined parameter tests ─────────────────────────────────────────────

  it('accepts both fid and days parameters together', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '888', days: '180' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fid).toBe(888);
    expect(body.days).toBe(180);
  });

  it('handles edge case of fid 1 (valid minimum)', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fid).toBe(1);
  });

  it('handles large fid values', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth', { fid: '999999999' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fid).toBe(999999999);
  });

  it('date calculation is approximately correct', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const beforeCall = new Date();
    beforeCall.setDate(beforeCall.getDate() - 10);
    const beforeStr = beforeCall.toISOString().split('T')[0];

    await GET(makeGetRequest('/api/social/growth', { days: '10' }));

    const gteCall = (chain.gte as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    const queryDate = gteCall[1];

    // Query date should be the date from 10 days ago
    // Allow a 1-day margin for timing variations
    expect(queryDate).toBe(beforeStr);
  });

  // ── Response structure tests ───────────────────────────────────────────────

  it('response has required fields', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('fid');
    expect(body).toHaveProperty('days');
    expect(body).toHaveProperty('history');
  });

  it('response does not include error field on success', async () => {
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    const body = await res.json();
    expect(body).not.toHaveProperty('error');
  });

  it('history array contains properly mapped entries', async () => {
    const rawData = [
      {
        snapshot_date: '2026-06-01',
        follower_count: 50,
        following_count: 25,
        engagement_score: 0.5,
      },
      {
        snapshot_date: '2026-06-02',
        follower_count: 55,
        following_count: 28,
        engagement_score: 0.55,
      },
      {
        snapshot_date: '2026-06-03',
        follower_count: 60,
        following_count: 30,
        engagement_score: 0.6,
      },
    ];
    const chain = chainMock({ data: rawData, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/social/growth'));
    const body = await res.json();

    expect(body.history).toHaveLength(3);
    expect(body.history[0]).toEqual({
      date: '2026-06-01',
      followerCount: 50,
      followingCount: 25,
      engagementScore: 0.5,
    });
    expect(body.history[2]).toEqual({
      date: '2026-06-03',
      followerCount: 60,
      followingCount: 30,
      engagementScore: 0.6,
    });
  });
});
