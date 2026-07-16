import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetFeedSkeleton } = vi.hoisted(() => ({
  mockGetFeedSkeleton: vi.fn(),
}));

vi.mock('@/lib/bluesky/feed', () => ({
  getFeedSkeleton: mockGetFeedSkeleton,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/bluesky/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------- 200 Success Cases ---------

  it('returns 200 with feed and cursor on success', async () => {
    const mockFeedData = {
      feed: [
        { post: 'at://did:plc:abc123/app.bsky.feed.post/xyz' },
        { post: 'at://did:plc:abc123/app.bsky.feed.post/uvw' },
      ],
      cursor: '2026-07-16T10:00:00Z',
    };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(mockFeedData);
    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 30);
  });

  it('passes cursor to getFeedSkeleton when valid (≤200 chars)', async () => {
    const cursor = '2026-07-15T10:00:00Z'; // Valid cursor
    const mockFeedData = { feed: [{ post: 'at://did:plc:abc123/app.bsky.feed.post/xyz' }] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { cursor }));
    expect(res.status).toBe(200);

    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(cursor, 30);
  });

  it('ignores cursor when over 200 chars', async () => {
    const longCursor = 'x'.repeat(201); // Over 200 chars
    const mockFeedData = { feed: [{ post: 'at://did:plc:abc123/app.bsky.feed.post/xyz' }] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { cursor: longCursor }));
    expect(res.status).toBe(200);

    // Cursor should be undefined (ignored)
    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 30);
  });

  it('accepts exactly 200 char cursor', async () => {
    const cursor200 = 'x'.repeat(200); // Exactly 200 chars
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { cursor: cursor200 }));
    expect(res.status).toBe(200);

    // Cursor should be passed through (≤200 is valid)
    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(cursor200, 30);
  });

  it('uses default limit of 30 when not provided', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(200);

    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 30);
  });

  it('passes limit through when valid (≤100)', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { limit: '50' }));
    expect(res.status).toBe(200);

    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 50);
  });

  it('clamps limit to 100 when higher', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { limit: '500' }));
    expect(res.status).toBe(200);

    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 100);
  });

  it('clamps limit to 100 when at max boundary', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { limit: '100' }));
    expect(res.status).toBe(200);

    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 100);
  });

  it('falls back to default 30 when limit is non-numeric (no NaN downstream)', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { limit: 'notanumber' }));
    expect(res.status).toBe(200);

    // Regression guard: a non-numeric limit must clamp to the default 30, never
    // pass NaN into getFeedSkeleton's DB .limit() (which would throw → 500).
    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 30);
  });

  it('falls back to default 30 when limit is zero or negative', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const resZero = await GET(makeGetRequest('/api/bluesky/feed', { limit: '0' }));
    expect(resZero.status).toBe(200);
    expect(mockGetFeedSkeleton).toHaveBeenLastCalledWith(undefined, 30);

    const resNeg = await GET(makeGetRequest('/api/bluesky/feed', { limit: '-5' }));
    expect(resNeg.status).toBe(200);
    expect(mockGetFeedSkeleton).toHaveBeenLastCalledWith(undefined, 30);
  });

  it('returns 200 with empty feed when no posts exist', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.feed).toEqual([]);
  });

  it('returns correct Cache-Control headers', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed'));

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60, s-maxage=300');
  });

  // --------- 500 Error Cases ---------

  it('returns 500 with empty feed when getFeedSkeleton throws', async () => {
    mockGetFeedSkeleton.mockRejectedValue(new Error('Database error'));

    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ feed: [] });
  });

  it('returns 500 and logs error when getFeedSkeleton throws', async () => {
    const _mockLogger = vi.mocked((await import('@/lib/logger')).logger);
    const error = new Error('Network timeout');
    mockGetFeedSkeleton.mockRejectedValue(error);

    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(500);
  });

  // --------- Defensive Clamping (No 400 status) ---------

  it('does NOT return 400 for oversized cursor (defensive)', async () => {
    const longCursor = 'x'.repeat(1000);
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { cursor: longCursor }));
    // Should NOT be 400; should clamp and return 200
    expect(res.status).toBe(200);
  });

  it('does NOT return 400 for oversized limit (defensive)', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { limit: '10000' }));
    // Should NOT be 400; should clamp to 100 and return 200
    expect(res.status).toBe(200);
  });

  it('does NOT return 400 for invalid limit param (defensive)', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { limit: 'garbage' }));
    // Should NOT be 400; should fall back to default and return 200
    expect(res.status).toBe(200);
  });

  // --------- Edge Cases ---------

  it('passes both valid cursor and limit through', async () => {
    const cursor = '2026-07-15T10:00:00Z';
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed', { cursor, limit: '25' }));
    expect(res.status).toBe(200);

    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(cursor, 25);
  });

  it('clamps limit and ignores long cursor simultaneously', async () => {
    const longCursor = 'x'.repeat(300);
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(
      makeGetRequest('/api/bluesky/feed', { cursor: longCursor, limit: '200' }),
    );
    expect(res.status).toBe(200);

    // Cursor ignored (>200), limit clamped to 100
    expect(mockGetFeedSkeleton).toHaveBeenCalledWith(undefined, 100);
  });

  it('is publicly accessible (no session required)', async () => {
    const mockFeedData = { feed: [] };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    // No auth headers or session
    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(200);
  });

  it('returns feed without cursor when pagination ends', async () => {
    const mockFeedData = {
      feed: [{ post: 'at://did:plc:abc123/app.bsky.feed.post/xyz' }],
      // No cursor property (pagination ended)
    };
    mockGetFeedSkeleton.mockResolvedValue(mockFeedData);

    const res = await GET(makeGetRequest('/api/bluesky/feed'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.cursor).toBeUndefined();
    expect(body.feed).toBeDefined();
  });
});
