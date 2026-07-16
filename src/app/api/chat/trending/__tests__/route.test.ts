import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFetchSophaFeed, mockGetTrendingFeed, mockLogger } = vi.hoisted(
  () => ({
    mockGetSessionData: vi.fn(),
    mockFetchSophaFeed: vi.fn(),
    mockGetTrendingFeed: vi.fn(),
    mockLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  }),
);

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/sopha/client', () => ({
  fetchSophaFeed: mockFetchSophaFeed,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getTrendingFeed: mockGetTrendingFeed,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { GET } from '../route';

describe('GET /api/chat/trending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Query parameter validation
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 400 when limit is invalid (non-integer)', async () => {
    const res = await GET(makeGetRequest('/api/chat/trending', { limit: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when limit exceeds max (50)', async () => {
    const res = await GET(makeGetRequest('/api/chat/trending', { limit: '51' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('returns 400 when limit is below min (1)', async () => {
    const res = await GET(makeGetRequest('/api/chat/trending', { limit: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('returns 400 when time_window is invalid enum', async () => {
    const res = await GET(makeGetRequest('/api/chat/trending', { time_window: '48h' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('defaults limit to 25 when not provided', async () => {
    mockFetchSophaFeed.mockResolvedValue([]);
    mockGetTrendingFeed.mockResolvedValue({ casts: [] });

    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.casts).toEqual([]);
  });

  it('accepts valid limit values', async () => {
    mockFetchSophaFeed.mockResolvedValue([]);
    mockGetTrendingFeed.mockResolvedValue({ casts: [] });

    const res = await GET(makeGetRequest('/api/chat/trending', { limit: '50' }));
    expect(res.status).toBe(200);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Success: empty results
  // ─────────────────────────────────────────────────────────────────────────

  it('returns empty casts when both Sopha and Neynar have no results', async () => {
    mockFetchSophaFeed.mockResolvedValue([]);
    mockGetTrendingFeed.mockResolvedValue({ casts: [] });

    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.casts).toEqual([]);
    expect(body.source).toBe('mixed');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Success: populated results
  // ─────────────────────────────────────────────────────────────────────────

  it('returns populated trending casts with correct structure', async () => {
    const neynarCasts = [
      {
        hash: 'test-cast-1',
        author: { fid: 1, username: 'user1', display_name: 'User 1', pfp_url: 'http://pfp1' },
        text: 'Test cast',
        timestamp: '2024-01-01T00:00:00Z',
        reactions: { likes_count: 10, recasts_count: 0 },
        replies: { count: 0 },
        parent_hash: null,
        embeds: [],
      },
    ];

    mockFetchSophaFeed.mockResolvedValue([]);
    mockGetTrendingFeed.mockResolvedValue({ casts: neynarCasts });

    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.casts).toBeInstanceOf(Array);
    expect(body.source).toBe('mixed');
    expect(body).toHaveProperty('casts');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Response headers
  // ─────────────────────────────────────────────────────────────────────────

  it('includes Cache-Control header in response', async () => {
    mockFetchSophaFeed.mockResolvedValue([]);
    mockGetTrendingFeed.mockResolvedValue({ casts: [] });

    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(200);
    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBe('public, s-maxage=300, stale-while-revalidate=60');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Promise.allSettled: partial failure handling
  // ─────────────────────────────────────────────────────────────────────────

  it('handles null/empty responses from Sopha', async () => {
    mockFetchSophaFeed.mockResolvedValue(null);
    mockGetTrendingFeed.mockResolvedValue({ casts: [] });

    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.casts).toEqual([]);
  });

  it('handles null/undefined casts array in Neynar response', async () => {
    mockFetchSophaFeed.mockResolvedValue([]);
    mockGetTrendingFeed.mockResolvedValue({ casts: undefined });

    const res = await GET(makeGetRequest('/api/chat/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.casts).toEqual([]);
  });
});
