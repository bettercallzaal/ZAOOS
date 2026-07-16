import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('GET /api/songjam/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Since the route module caches at module level, we need to reload it for tests
    // that depend on cache state changing
    vi.resetModules();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Query parameter validation
  // ─────────────────────────────────────────────────────────────────────────

  it('defaults to projectId=bettercallzaal_s2 and timeframe=all', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));
    expect(res.status).toBe(200);

    // Verify fetch was called with correct endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      'https://songjamspace-leaderboard.logesh-063.workers.dev/bettercallzaal_s2',
    );
  });

  it('uses custom projectId from query param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', { projectId: 'custom_project' }),
    );
    expect(res.status).toBe(200);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://songjamspace-leaderboard.logesh-063.workers.dev/custom_project',
    );
  });

  it('appends _daily suffix when timeframe=daily', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', { timeframe: 'daily' }),
    );
    expect(res.status).toBe(200);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://songjamspace-leaderboard.logesh-063.workers.dev/bettercallzaal_s2_daily',
    );
  });

  it('appends _weekly suffix when timeframe=weekly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', { timeframe: 'weekly' }),
    );
    expect(res.status).toBe(200);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://songjamspace-leaderboard.logesh-063.workers.dev/bettercallzaal_s2_weekly',
    );
  });

  it('returns 400 when timeframe is invalid', async () => {
    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', { timeframe: 'invalid' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid params');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Success: populated and empty leaderboards
  // ─────────────────────────────────────────────────────────────────────────

  it('returns leaderboard data when fetch succeeds', async () => {
    const leaderboardData = {
      entries: [
        { rank: 1, user: 'alice', score: 100 },
        { rank: 2, user: 'bob', score: 90 },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => leaderboardData,
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(leaderboardData);
  });

  it('returns empty leaderboard when fetch returns empty data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.entries).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Caching: 60-second TTL
  // ─────────────────────────────────────────────────────────────────────────

  it('returns cached data on second request within 60 seconds', async () => {
    const leaderboardData = { entries: [{ rank: 1, user: 'alice', score: 100 }] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => leaderboardData,
    });

    const { GET: RouteHandler } = await import('../route');

    // First request
    const res1 = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1).toEqual(leaderboardData);

    // Second request (should use cache) — WITHOUT vi.resetModules so cache persists
    const res2 = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2).toEqual(leaderboardData);

    // Fetch should only be called once (second call used cache)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not use cache for different endpoints', async () => {
    const leaderboard1 = { entries: [{ rank: 1, user: 'alice', score: 100 }] };
    const leaderboard2 = { entries: [{ rank: 1, user: 'bob', score: 95 }] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => leaderboard1,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => leaderboard2,
    });

    const { GET: RouteHandler } = await import('../route');

    // Request with default projectId
    const res1 = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1).toEqual(leaderboard1);

    // Request with different projectId — no reset, so cache from different project key
    const res2 = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', { projectId: 'other_project' }),
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2).toEqual(leaderboard2);

    // Fetch should be called twice (different cache keys)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: fetch failures
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 502 when upstream fetch fails (not ok)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'upstream error' }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch leaderboard');
  });

  it('returns 502 when upstream returns 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'not found' }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch leaderboard');
  });

  it('returns 500 when fetch throws an error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('logs error when fetch fails', async () => {
    const fetchError = new Error('Network timeout');
    mockFetch.mockRejectedValueOnce(fetchError);

    const { logger } = await import('@/lib/logger');
    const { GET: RouteHandler } = await import('../route');

    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));

    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith('Songjam leaderboard error:', fetchError);
  });

  it('returns 500 when JSON parsing fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(makeGetRequest('/api/songjam/leaderboard'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Query parameter edge cases
  // ─────────────────────────────────────────────────────────────────────────

  it('allows both custom projectId and timeframe together', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', {
        projectId: 'my_project',
        timeframe: 'weekly',
      }),
    );

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://songjamspace-leaderboard.logesh-063.workers.dev/my_project_weekly',
    );
  });

  it('ignores extra query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });

    const { GET: RouteHandler } = await import('../route');
    const res = await RouteHandler(
      makeGetRequest('/api/songjam/leaderboard', {
        projectId: 'my_project',
        timeframe: 'all',
        extra: 'param',
        another: 'value',
      }),
    );

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://songjamspace-leaderboard.logesh-063.workers.dev/my_project',
    );
  });
});
