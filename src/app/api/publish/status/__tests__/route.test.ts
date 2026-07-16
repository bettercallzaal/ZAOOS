import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

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
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Supabase query chain that records filter methods and resolves to `result`.
 * Lets tests assert select/eq/order chains were applied without a live DB.
 */
function publishStatusChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'order']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/publish/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/publish/status'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 400 when castHash is missing', async () => {
    const res = await GET(makeGetRequest('/api/publish/status'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when castHash is empty string', async () => {
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns empty results array when no publish_log entries found', async () => {
    const chain = publishStatusChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(res.status).toBe(200);
    expect((await res.json()).results).toEqual([]);
  });

  it('returns results when publish_log entries exist', async () => {
    const data = [
      {
        platform: 'farcaster',
        status: 'published',
        platform_url: 'https://warpcast.com/cast',
        platform_post_id: 'post_1',
        error: null,
        created_at: '2026-07-15T10:00:00Z',
      },
      {
        platform: 'twitter',
        status: 'failed',
        platform_url: null,
        platform_post_id: null,
        error: 'API rate limit exceeded',
        created_at: '2026-07-15T10:01:00Z',
      },
    ];
    const chain = publishStatusChain({ data, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.results[0]).toEqual({
      platform: 'farcaster',
      status: 'published',
      platformUrl: 'https://warpcast.com/cast',
      platformPostId: 'post_1',
      error: null,
      createdAt: '2026-07-15T10:00:00Z',
    });
    expect(body.results[1]).toEqual({
      platform: 'twitter',
      status: 'failed',
      platformUrl: null,
      platformPostId: null,
      error: 'API rate limit exceeded',
      createdAt: '2026-07-15T10:01:00Z',
    });
  });

  it('filters results by cast_hash and fid from session', async () => {
    const chain = publishStatusChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/publish/status', { castHash: 'test_hash' }));
    expect(chain.eq).toHaveBeenCalledWith('cast_hash', 'test_hash');
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('orders results by created_at descending', async () => {
    const chain = publishStatusChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('coerces null data to empty array', async () => {
    const chain = publishStatusChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect((await res.json()).results).toEqual([]);
  });

  it('maps snake_case database columns to camelCase', async () => {
    const data = [
      {
        platform: 'bluesky',
        status: 'queued',
        platform_url: 'https://bsky.app/post',
        platform_post_id: 'post_2',
        error: null,
        created_at: '2026-07-15T11:00:00Z',
      },
    ];
    const chain = publishStatusChain({ data, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: 'xyz789' }));
    const body = await res.json();
    expect(body.results[0]).toHaveProperty('platformUrl');
    expect(body.results[0]).toHaveProperty('platformPostId');
    expect(body.results[0]).toHaveProperty('createdAt');
  });

  it('returns 500 when database query errors', async () => {
    const chain = publishStatusChain({ data: null, error: new Error('db connection failed') });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch publish status');
  });

  it('returns 500 and catches thrown errors', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    const res = await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch publish status');
  });

  it('calls supabaseAdmin.from with publish_log table', async () => {
    const chain = publishStatusChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(mockFrom).toHaveBeenCalledWith('publish_log');
  });

  it('selects the expected database columns', async () => {
    const chain = publishStatusChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/publish/status', { castHash: 'abc123' }));
    expect(chain.select).toHaveBeenCalledWith(
      'platform, status, platform_url, platform_post_id, error, created_at',
    );
  });
});
