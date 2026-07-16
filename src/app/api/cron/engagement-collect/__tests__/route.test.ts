import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

const { mockIsThreadsConfigured } = vi.hoisted(() => ({
  mockIsThreadsConfigured: vi.fn(),
}));

const { mockFetchThreadsInsights } = vi.hoisted(() => ({
  mockFetchThreadsInsights: vi.fn(),
}));

const { mockGetXClient } = vi.hoisted(() => ({
  mockGetXClient: vi.fn(),
}));

const { mockFetchXInsights } = vi.hoisted(() => ({
  mockFetchXInsights: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/publish/threads', () => ({
  isThreadsConfigured: mockIsThreadsConfigured,
}));

vi.mock('@/lib/publish/threads-insights', () => ({
  fetchThreadsInsights: mockFetchThreadsInsights,
}));

vi.mock('@/lib/publish/x', () => ({
  getXClient: mockGetXClient,
}));

vi.mock('@/lib/publish/x-insights', () => ({
  fetchXInsights: mockFetchXInsights,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Helper: Build a queued chain for multiple sequential calls ──────────────

function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, unknown> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of ['select', 'insert', 'eq', 'gte', 'order']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (onFulfilled: unknown, _onRejected?: unknown) => {
    const result = q.shift() ?? { data: null, error: null };
    const callback = onFulfilled as (val: unknown) => unknown;
    return Promise.resolve(callback ? callback(result) : result);
  };

  return chain;
}

// ── Helper: Create a Supabase mock with per-from-call result queues ────────

function createSupabaseMock(resultQueues: Array<Array<{ data?: unknown; error?: unknown }>>) {
  let callIndex = 0;
  return () => {
    const results = resultQueues[callIndex] || [];
    callIndex++;
    return queuedChain([...results]);
  };
}

import { GET } from '../route';

describe('GET /api/cron/engagement-collect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  // ── Auth checks ──────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 500 when CRON_SECRET is not configured', async () => {
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer some-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error?: unknown };
      expect(body.error).toBe('CRON_SECRET not configured');
    });

    it('returns 401 when Authorization header is missing', async () => {
      process.env.CRON_SECRET = 'secret-token';
      const req = makeRequest('/api/cron/engagement-collect');

      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: unknown };
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when Authorization header is incorrect', async () => {
      process.env.CRON_SECRET = 'secret-token';
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer wrong-token' },
      });

      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: unknown };
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when Authorization header lacks Bearer prefix', async () => {
      process.env.CRON_SECRET = 'secret-token';
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'secret-token' },
      });

      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('passes auth when Bearer token matches CRON_SECRET', async () => {
      process.env.CRON_SECRET = 'secret-token';
      mockIsThreadsConfigured.mockReturnValue(false);
      mockGetXClient.mockReturnValue(null);
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer secret-token' },
      });

      const res = await GET(req);

      // Should pass auth and fail on "no platforms configured" check
      expect(res.status).toBe(503);
    });
  });

  // ── Platform configuration checks ────────────────────────────────────────

  describe('Platform configuration', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-secret';
    });

    it('returns 503 when no platforms are configured', async () => {
      mockIsThreadsConfigured.mockReturnValue(false);
      mockGetXClient.mockReturnValue(null);
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(503);
      const body = (await res.json()) as { error?: unknown; collected?: unknown };
      expect(body.error).toBe('No platforms configured');
      expect(body.collected).toBe(0);
    });

    it('skips Threads collection when Threads is not configured', async () => {
      mockIsThreadsConfigured.mockReturnValue(false);
      mockGetXClient.mockReturnValue({ v2: {} });
      mockFrom.mockImplementation(createSupabaseMock([[{ data: [], error: null }]]));
      mockFetchXInsights.mockResolvedValue({
        views: 100,
        likes: 10,
        replies: 2,
        reposts: 1,
        quotes: 0,
        bookmarks: 5,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockFetchThreadsInsights).not.toHaveBeenCalled();
    });

    it('skips X collection when X client is not configured', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      mockFrom.mockImplementation(createSupabaseMock([[{ data: [], error: null }]]));
      mockFetchThreadsInsights.mockResolvedValue({
        views: 50,
        likes: 5,
        replies: 1,
        reposts: 0,
        quotes: 0,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockFetchXInsights).not.toHaveBeenCalled();
    });
  });

  // ── Successful collection ────────────────────────────────────────────────

  describe('Successful engagement collection', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-secret';
    });

    it('collects Threads insights and returns aggregated result', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      const threadsPost = { id: 'post-1', platform_post_id: 'thread-123' };
      mockFrom.mockImplementation(
        createSupabaseMock([
          // First from() call: SELECT from publish_log for threads
          [{ data: [threadsPost], error: null }],
          // Second from() call: INSERT into engagement_metrics
          [{ data: null, error: null }],
        ]),
      );
      mockFetchThreadsInsights.mockResolvedValue({
        views: 1000,
        likes: 50,
        replies: 10,
        reposts: 5,
        quotes: 2,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        collected?: number;
        failed?: number;
        total?: number;
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.collected).toBe(1);
      expect(body.failed).toBe(0);
      expect(body.total).toBe(1);
      expect(body.platforms).toHaveLength(1);
      expect(body.platforms?.[0]?.platform).toBe('threads');
    });

    it('collects X insights and returns aggregated result', async () => {
      mockIsThreadsConfigured.mockReturnValue(false);
      mockGetXClient.mockReturnValue({ v2: {} });
      const xPost = { id: 'post-2', platform_post_id: 'tweet-456' };
      mockFrom.mockImplementation(
        createSupabaseMock([
          // First from() call: SELECT from publish_log for x
          [{ data: [xPost], error: null }],
          // Second from() call: INSERT into engagement_metrics
          [{ data: null, error: null }],
        ]),
      );
      mockFetchXInsights.mockResolvedValue({
        views: 2000,
        likes: 100,
        replies: 20,
        reposts: 15,
        quotes: 5,
        bookmarks: 30,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        collected?: number;
        failed?: number;
        total?: number;
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.collected).toBe(1);
      expect(body.failed).toBe(0);
      expect(body.total).toBe(1);
      expect(body.platforms?.[0]?.platform).toBe('x');
    });

    it('collects both Threads and X in same request', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue({ v2: {} });
      const threadsPost = { id: 'post-1', platform_post_id: 'thread-123' };
      const xPost = { id: 'post-2', platform_post_id: 'tweet-456' };

      mockFrom.mockImplementation(
        createSupabaseMock([
          // Threads SELECT
          [{ data: [threadsPost], error: null }],
          // Threads INSERT
          [{ data: null, error: null }],
          // X SELECT
          [{ data: [xPost], error: null }],
          // X INSERT
          [{ data: null, error: null }],
        ]),
      );
      mockFetchThreadsInsights.mockResolvedValue({
        views: 1000,
        likes: 50,
        replies: 10,
        reposts: 5,
        quotes: 2,
      });
      mockFetchXInsights.mockResolvedValue({
        views: 2000,
        likes: 100,
        replies: 20,
        reposts: 15,
        quotes: 5,
        bookmarks: 30,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        collected?: number;
        failed?: number;
        total?: number;
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.collected).toBe(2);
      expect(body.failed).toBe(0);
      expect(body.total).toBe(2);
      expect(body.platforms).toHaveLength(2);
    });

    it('handles empty post lists gracefully', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      mockFrom.mockImplementation(createSupabaseMock([[{ data: [], error: null }]]));
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        collected?: number;
        failed?: number;
        total?: number;
      };
      expect(body.collected).toBe(0);
      expect(body.failed).toBe(0);
      expect(body.total).toBe(0);
    });
  });

  // ── Error handling per platform ──────────────────────────────────────────

  describe('Per-platform error handling', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-secret';
    });

    it('returns 0 collected/failed when DB fetch fails for a platform', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      mockFrom.mockImplementation(
        createSupabaseMock([[{ data: null, error: 'DB connection error' }]]),
      );
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.platforms?.[0]?.collected).toBe(0);
      expect(body.platforms?.[0]?.failed).toBe(0);
      expect(body.platforms?.[0]?.total).toBe(0);
    });

    it('increments failed count when insights fetch fails for a post', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      const threadsPost = { id: 'post-1', platform_post_id: 'thread-123' };
      mockFrom.mockImplementation(
        createSupabaseMock([
          // SELECT posts
          [{ data: [threadsPost], error: null }],
          // INSERT engagement_metrics (will not be called since fetchThreadsInsights throws)
        ]),
      );
      mockFetchThreadsInsights.mockRejectedValue(new Error('API error'));
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.platforms?.[0]?.collected).toBe(0);
      expect(body.platforms?.[0]?.failed).toBe(1);
      expect(body.platforms?.[0]?.total).toBe(1);
    });

    it('increments failed count when insert fails for a post', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      const threadsPost = { id: 'post-1', platform_post_id: 'thread-123' };
      mockFrom.mockImplementation(
        createSupabaseMock([
          // SELECT posts
          [{ data: [threadsPost], error: null }],
          // INSERT engagement_metrics (fails)
          [{ data: null, error: 'Insert failed' }],
        ]),
      );
      mockFetchThreadsInsights.mockResolvedValue({
        views: 1000,
        likes: 50,
        replies: 10,
        reposts: 5,
        quotes: 2,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.platforms?.[0]?.collected).toBe(0);
      expect(body.platforms?.[0]?.failed).toBe(1);
      expect(body.platforms?.[0]?.total).toBe(1);
    });

    it('continues with second platform when first platform throws', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue({ v2: {} });
      const xPost = { id: 'post-2', platform_post_id: 'tweet-456' };
      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          // First platform (threads) SELECT throws
          return queuedChain([{ data: null, error: 'DB error for threads' }]);
        }
        // Second platform (x) SELECT succeeds
        return queuedChain([
          { data: [xPost], error: null },
          { data: null, error: null }, // X INSERT
        ]);
      });
      mockFetchXInsights.mockResolvedValue({
        views: 2000,
        likes: 100,
        replies: 20,
        reposts: 15,
        quotes: 5,
        bookmarks: 30,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        collected?: number;
        failed?: number;
        total?: number;
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.platforms).toHaveLength(2);
      // Threads had DB error
      expect(body.platforms?.[0]?.collected).toBe(0);
      // X succeeded
      expect(body.platforms?.[1]?.collected).toBe(1);
    });

    it('partially collects when some posts fail and others succeed', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      const post1 = { id: 'post-1', platform_post_id: 'thread-123' };
      const post2 = { id: 'post-2', platform_post_id: 'thread-456' };
      mockFrom.mockImplementation(
        createSupabaseMock([
          // SELECT posts (returns 2 posts)
          [{ data: [post1, post2], error: null }],
          // INSERT for post1 (succeeds)
          [{ data: null, error: null }],
          // INSERT for post2 (fails)
          [{ data: null, error: 'Insert failed' }],
        ]),
      );
      mockFetchThreadsInsights.mockResolvedValue({
        views: 1000,
        likes: 50,
        replies: 10,
        reposts: 5,
        quotes: 2,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        platforms?: Array<{
          platform?: string;
          collected?: number;
          failed?: number;
          total?: number;
        }>;
      };
      expect(body.platforms?.[0]?.collected).toBe(1);
      expect(body.platforms?.[0]?.failed).toBe(1);
      expect(body.platforms?.[0]?.total).toBe(2);
    });
  });

  // ── Top-level error handling ────────────────────────────────────────────

  describe('Top-level error handling', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-secret';
    });

    it('returns 500 when an unexpected error occurs', async () => {
      mockIsThreadsConfigured.mockImplementation(() => {
        throw new Error('Unexpected error in isThreadsConfigured');
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error?: unknown };
      expect(body.error).toBe('Engagement collection failed');
    });
  });

  // ── Insights fetcher behavior ────────────────────────────────────────────

  describe('Insights fetcher behavior', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-secret';
    });

    it('correctly transforms Threads insights into engagement_metrics insert', async () => {
      mockIsThreadsConfigured.mockReturnValue(true);
      mockGetXClient.mockReturnValue(null);
      const threadsPost = { id: 'pub-123', platform_post_id: 'thread-xyz' };
      let insertPayload: unknown;
      let insertCalled = false;
      mockFrom.mockImplementation(
        createSupabaseMock([[{ data: [threadsPost], error: null }], [{ data: null, error: null }]]),
      );
      // Spy on the insert call to capture payload
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chain = queuedChain(
          callCount === 0 ? [{ data: [threadsPost], error: null }] : [{ data: null, error: null }],
        );
        callCount++;
        const originalChainInsert = chain.insert as ReturnType<typeof vi.fn>;
        if (originalChainInsert) {
          originalChainInsert.mockImplementation((_payload: unknown) => {
            insertPayload = _payload;
            insertCalled = true;
            return chain;
          });
        }
        return chain;
      });
      mockFetchThreadsInsights.mockResolvedValue({
        views: 1000,
        likes: 50,
        replies: 10,
        reposts: 5,
        quotes: 2,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(insertCalled).toBe(true);
      expect(insertPayload).toMatchObject({
        publish_log_id: 'pub-123',
        platform: 'threads',
        platform_post_id: 'thread-xyz',
        views: 1000,
        likes: 50,
        replies: 10,
        reposts: 5,
        quotes: 2,
        clicks: 0,
      });
    });

    it('correctly transforms X insights into engagement_metrics insert', async () => {
      mockIsThreadsConfigured.mockReturnValue(false);
      mockGetXClient.mockReturnValue({ v2: {} });
      const xPost = { id: 'pub-456', platform_post_id: 'tweet-abc' };
      let insertPayload: unknown;
      let insertCalled = false;
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chain = queuedChain(
          callCount === 0 ? [{ data: [xPost], error: null }] : [{ data: null, error: null }],
        );
        callCount++;
        const originalChainInsert = chain.insert as ReturnType<typeof vi.fn>;
        if (originalChainInsert) {
          originalChainInsert.mockImplementation((_payload: unknown) => {
            insertPayload = _payload;
            insertCalled = true;
            return chain;
          });
        }
        return chain;
      });
      mockFetchXInsights.mockResolvedValue({
        views: 2000,
        likes: 100,
        replies: 20,
        reposts: 15,
        quotes: 5,
        bookmarks: 30,
      });
      const req = makeRequest('/api/cron/engagement-collect', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(insertCalled).toBe(true);
      expect(insertPayload).toMatchObject({
        publish_log_id: 'pub-456',
        platform: 'x',
        platform_post_id: 'tweet-abc',
        views: 2000,
        likes: 100,
        replies: 20,
        reposts: 15,
        quotes: 5,
        clicks: 0,
      });
    });
  });
});
