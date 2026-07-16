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
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for further chaining.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

describe('GET /api/publish/engagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Input validation tests ────────────────────────────────────────────────

  it('returns 400 when limit exceeds max (100)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await GET(makeGetRequest('/api/publish/engagement', { limit: '150' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when limit is below min (1)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await GET(makeGetRequest('/api/publish/engagement', { limit: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when limit is not a number', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await GET(makeGetRequest('/api/publish/engagement', { limit: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  // ── Success path tests (with defaults) ────────────────────────────────────

  it('returns empty metrics array when no engagement data exists', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metrics).toEqual([]);
  });

  it('fetches engagement_metrics table with correct defaults', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement'));

    expect(mockFrom).toHaveBeenCalledWith('engagement_metrics');
    expect(chain.select).toHaveBeenCalledWith(
      `
        id,
        publish_log_id,
        platform,
        platform_post_id,
        views,
        likes,
        replies,
        reposts,
        quotes,
        clicks,
        fetched_at,
        publish_log (
          cast_hash,
          platform_url,
          text,
          published_by_fid,
          created_at
        )
      `,
    );
    expect(chain.order).toHaveBeenCalledWith('fetched_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it('applies platform filter when provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement', { platform: 'threads' }));

    expect(chain.eq).toHaveBeenCalledWith('platform', 'threads');
  });

  it('applies custom limit when provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement', { limit: '25' }));

    expect(chain.limit).toHaveBeenCalledWith(25);
  });

  it('applies both platform and limit filters', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement', { platform: 'farcaster', limit: '10' }));

    expect(chain.eq).toHaveBeenCalledWith('platform', 'farcaster');
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('returns metrics with joined publish_log data', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const metricsData = [
      {
        id: 'metric-1',
        publish_log_id: 'log-1',
        platform: 'farcaster',
        platform_post_id: 'post-1',
        views: 100,
        likes: 10,
        replies: 2,
        reposts: 5,
        quotes: 1,
        clicks: 20,
        fetched_at: '2026-07-16T10:00:00Z',
        publish_log: {
          cast_hash: 'hash123',
          platform_url: 'https://warpcast.com/post/hash123',
          text: 'Hello world',
          published_by_fid: 123,
          created_at: '2026-07-16T09:00:00Z',
        },
      },
      {
        id: 'metric-2',
        publish_log_id: 'log-2',
        platform: 'threads',
        platform_post_id: 'post-2',
        views: 50,
        likes: 5,
        replies: 1,
        reposts: 2,
        quotes: 0,
        clicks: 10,
        fetched_at: '2026-07-16T11:00:00Z',
        publish_log: {
          cast_hash: 'hash456',
          platform_url: 'https://threads.net/post/456',
          text: 'Another post',
          published_by_fid: 456,
          created_at: '2026-07-16T10:30:00Z',
        },
      },
    ];

    const chain = chainMock({ data: metricsData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metrics).toHaveLength(2);
    expect(body.metrics[0].platform).toBe('farcaster');
    expect(body.metrics[0].publish_log.text).toBe('Hello world');
    expect(body.metrics[1].platform).toBe('threads');
    expect(body.metrics[1].publish_log.text).toBe('Another post');
  });

  it('respects ordering by fetched_at descending', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement'));

    // order() is called with 'fetched_at' and { ascending: false }
    expect(chain.order).toHaveBeenCalledWith('fetched_at', { ascending: false });
  });

  // ── Error path tests ──────────────────────────────────────────────────────

  it('returns 500 when supabase query fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: null, error: { message: 'Database error' } });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch engagement metrics');
  });

  it('returns 500 when an exception is thrown', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch engagement metrics');
  });

  it('returns 500 when getSessionData throws', async () => {
    mockGetSessionData.mockRejectedValue(new Error('Session error'));

    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch engagement metrics');
  });

  // ── Query chain construction tests ────────────────────────────────────────

  it('calls supabase.from() exactly once', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement'));

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('engagement_metrics');
  });

  it('builds select clause with all required fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement'));

    const selectCall = (chain.select as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(selectCall).toContain('id');
    expect(selectCall).toContain('publish_log_id');
    expect(selectCall).toContain('platform');
    expect(selectCall).toContain('platform_post_id');
    expect(selectCall).toContain('views');
    expect(selectCall).toContain('likes');
    expect(selectCall).toContain('replies');
    expect(selectCall).toContain('reposts');
    expect(selectCall).toContain('quotes');
    expect(selectCall).toContain('clicks');
    expect(selectCall).toContain('fetched_at');
    expect(selectCall).toContain('publish_log');
  });

  it('includes publish_log relationship in select', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement'));

    const selectCall = (chain.select as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(selectCall).toContain('publish_log');
    expect(selectCall).toContain('cast_hash');
    expect(selectCall).toContain('platform_url');
    expect(selectCall).toContain('text');
    expect(selectCall).toContain('published_by_fid');
    expect(selectCall).toContain('created_at');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('handles max limit correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement', { limit: '100' }));

    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('handles limit as string "50" (default coerced)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement', { limit: '50' }));

    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it('does not apply eq() filter when platform is omitted', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/publish/engagement'));

    expect((chain.eq as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('handles empty string platform parameter', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    // Empty string is falsy, so platform should be undefined
    await GET(makeGetRequest('/api/publish/engagement', { platform: '' }));

    // Should not call eq() since platform is empty/undefined
    expect((chain.eq as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('handles metrics with null values gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const metricsData = [
      {
        id: 'metric-1',
        publish_log_id: 'log-1',
        platform: 'farcaster',
        platform_post_id: 'post-1',
        views: null,
        likes: null,
        replies: null,
        reposts: null,
        quotes: null,
        clicks: null,
        fetched_at: '2026-07-16T10:00:00Z',
        publish_log: null,
      },
    ];

    const chain = chainMock({ data: metricsData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/publish/engagement'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metrics).toHaveLength(1);
    expect(body.metrics[0].views).toBeNull();
  });
});
