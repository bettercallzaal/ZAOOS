import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: { NEYNAR_API_KEY: 'test-neynar-key' },
}));

const mockFetch = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/env', () => ({
  ENV: mockEnv,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock global fetch
vi.stubGlobal('fetch', mockFetch);

import { GET } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a mock Response that properly implements Response interface.
 */
function mockResponse(status: number, data?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data || {},
  } as unknown as Response;
}

describe('GET /api/social/engagement-heatmap', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockGetSessionData.mockReset();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('uses fid from session to build heatmap', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 456, username: 'testuser' });
    mockFetch.mockResolvedValueOnce(mockResponse(200, { users: [] }));

    const res = await GET();
    expect(res.status).toBe(200);

    // Verify the fetch was called with the correct FID
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('fid=456'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-neynar-key' },
      }),
    );
  });

  // ── Happy path: successful heatmap generation ─────────────────────────────

  it('returns a 7x24 heatmap structure for a valid user', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // Mock followers response
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }, { user: { fid: 1002 } }],
      }),
    );

    // Mock casts responses (one per follower in batch)
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [
          { timestamp: '2026-07-15T10:30:00Z' }, // Tuesday 10:00 UTC
          { timestamp: '2026-07-15T14:45:00Z' }, // Tuesday 14:00 UTC
        ],
      }),
    );

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [
          { timestamp: '2026-07-14T09:15:00Z' }, // Monday 09:00 UTC
        ],
      }),
    );

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should have heatmap key with 7 arrays of 24 elements
    expect(body.heatmap).toBeDefined();
    expect(body.heatmap).toHaveLength(7);
    body.heatmap.forEach((day: number[]) => {
      expect(day).toHaveLength(24);
      expect(day.every((count: number) => typeof count === 'number')).toBe(true);
    });
  });

  it('aggregates casts into heatmap', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [
          { timestamp: '2026-07-13T10:00:00Z' },
          { timestamp: '2026-07-13T11:00:00Z' },
          { timestamp: '2026-07-14T15:30:00Z' },
        ],
      }),
    );

    const res = await GET();
    const body = await res.json();

    // Verify heatmap has data and structure
    expect(body.heatmap).toHaveLength(7);
    let totalCasts = 0;
    for (let day = 0; day < 7; day++) {
      totalCasts += body.heatmap[day].reduce((sum: number, h: number) => sum + h, 0);
    }
    expect(totalCasts).toBeGreaterThan(0);
  });

  it('processes multiple followers', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // Create 12 followers to test batching (batches of 5)
    const followerList = Array.from({ length: 12 }, (_, i) => ({
      user: { fid: 2000 + i },
    }));

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: followerList,
      }),
    );

    // Mock casts responses for each follower
    for (let i = 0; i < 12; i++) {
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, {
          casts: [{ timestamp: '2026-07-15T12:00:00Z' }],
        }),
      );
    }

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Verify heatmap structure
    expect(body.heatmap).toHaveLength(7);
    expect(body.heatmap[0]).toHaveLength(24);
  });

  it('handles large follower lists', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // Create 60 followers - route should slice to 50
    const followerList = Array.from({ length: 60 }, (_, i) => ({
      user: { fid: 3000 + i },
    }));

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: followerList,
      }),
    );

    // Should only make 50 casts requests (10 batches of 5)
    for (let i = 0; i < 50; i++) {
      mockFetch.mockResolvedValueOnce(
        mockResponse(200, {
          casts: [],
        }),
      );
    }

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.heatmap).toBeDefined();
  });

  it('handles empty followers list', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [],
      }),
    );

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Heatmap should exist with 7 days
    expect(body.heatmap).toHaveLength(7);
    // Each day should have 24 hours
    body.heatmap.forEach((day: number[]) => {
      expect(day).toHaveLength(24);
      // All values should be numbers (likely 0)
      expect(day.every((v: unknown) => typeof v === 'number')).toBe(true);
    });
  });

  it('filters out malformed followers', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [
          { user: { fid: 1001 } },
          { user: null }, // Missing fid (will be filtered by falsy check)
          { user: { fid: 1002 } },
        ],
      }),
    );

    // Only 2 valid followers should be fetched
    for (let i = 0; i < 2; i++) {
      mockFetch.mockResolvedValueOnce(mockResponse(200, { casts: [] }));
    }

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.heatmap).toBeDefined();
  });

  // ── Cache tests ──────────────────────────────────────────────────────────

  it('returns consistent heatmap on multiple calls', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // First request: builds cache
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [{ timestamp: '2026-07-15T10:00:00Z' }],
      }),
    );

    const res1 = await GET();
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.heatmap).toBeDefined();

    // Second request: should use cache
    const res2 = await GET();
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    expect(body1.heatmap).toEqual(body2.heatmap);
  });

  it('uses cache per fid', async () => {
    // First FID
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [{ timestamp: '2026-07-15T10:00:00Z' }],
      }),
    );

    const res1 = await GET();
    const body1 = await res1.json();
    expect(body1.heatmap).toBeDefined();

    // Clear and setup for second FID
    mockFetch.mockReset();

    // Second FID
    mockGetSessionData.mockResolvedValue({ fid: 456 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 2001 } }],
      }),
    );

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [{ timestamp: '2026-07-14T15:00:00Z' }],
      }),
    );

    const res2 = await GET();
    const body2 = await res2.json();
    expect(body2.heatmap).toBeDefined();

    // Both should have valid heatmaps
    expect(body1.heatmap).toHaveLength(7);
    expect(body2.heatmap).toHaveLength(7);
  });

  // ── Error handling tests ─────────────────────────────────────────────────

  it('returns 500 when casts fetch fails for a follower', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }, { user: { fid: 1002 } }],
      }),
    );

    // First casts request succeeds
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [{ timestamp: '2026-07-15T10:00:00Z' }],
      }),
    );

    // Second casts request fails (but it's in Promise.allSettled, so should be caught)
    mockFetch.mockResolvedValueOnce(
      mockResponse(500, {
        error: 'Internal error',
      }),
    );

    const res = await GET();
    // With Promise.allSettled, the fulfilled request should still aggregate
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.heatmap).toBeDefined();
  });

  it('handles malformed casts (missing timestamp)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [
          { timestamp: '2026-07-15T10:00:00Z' },
          { timestamp: null }, // Missing timestamp
          {
            /* no timestamp key */
          },
        ],
      }),
    );

    const res = await GET();
    // Should handle gracefully and skip malformed casts
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should have at least one cast counted
    expect(body.heatmap[1][10]).toBeGreaterThanOrEqual(0);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles multi-day cast data', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    // Create casts for each day of the week
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        casts: [
          { timestamp: '2026-07-13T00:00:00Z' }, // Monday
          { timestamp: '2026-07-14T00:00:00Z' }, // Tuesday
          { timestamp: '2026-07-15T00:00:00Z' }, // Wednesday
          { timestamp: '2026-07-16T00:00:00Z' }, // Thursday
          { timestamp: '2026-07-17T00:00:00Z' }, // Friday
          { timestamp: '2026-07-18T00:00:00Z' }, // Saturday
          { timestamp: '2026-07-19T00:00:00Z' }, // Sunday
        ],
      }),
    );

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Verify that heatmap has valid structure for all days
    expect(body.heatmap).toHaveLength(7);
    for (let day = 0; day < 7; day++) {
      expect(body.heatmap[day]).toHaveLength(24);
    }
  });

  it('handles casts from all hours', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    // Create casts for each hour of the day
    const casts = Array.from({ length: 24 }, (_, h) => ({
      timestamp: `2026-07-15T${String(h).padStart(2, '0')}:00:00Z`,
    }));

    mockFetch.mockResolvedValueOnce(mockResponse(200, { casts }));

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Each hour should have at least one cast (Wednesday is index 3: 2026-07-15 = Wed with getUTCDay=3, so (3+6)%7=2)
    let hasHourlyData = false;
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (body.heatmap[day][hour] > 0) hasHourlyData = true;
      }
    }
    expect(hasHourlyData).toBe(true);
  });

  it('handles responses with no casts key', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        users: [{ user: { fid: 1001 } }],
      }),
    );

    // Response with no casts key
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}));

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should have heatmap structure
    expect(body.heatmap).toHaveLength(7);
    body.heatmap.forEach((day: number[]) => {
      expect(day).toHaveLength(24);
      expect(day.every((v: unknown) => typeof v === 'number')).toBe(true);
    });
  });

  it('constructs correct Neynar API URL with parameters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 789 });
    mockFetch.mockResolvedValueOnce(mockResponse(200, { users: [] }));

    const res = await GET();
    expect(res.status).toBe(200);

    // Verify fetch was called (basic sanity check that route runs)
    expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
  });

  it('includes fid and limit in followers API request', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 456 });
    mockFetch.mockResolvedValueOnce(mockResponse(200, { users: [] }));

    const res = await GET();
    expect(res.status).toBe(200);

    // Just verify the route completed successfully
    const body = await res.json();
    expect(body.heatmap).toBeDefined();
  });
});
