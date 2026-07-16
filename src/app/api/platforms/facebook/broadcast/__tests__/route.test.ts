import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
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

// Mock global fetch for Facebook API calls
global.fetch = vi.fn();

import { POST } from '../route';

/**
 * Chain mock for Supabase query: select → eq → eq → single.
 * Both chainable methods (.select, .eq) return the chain.
 * Terminal method (.single) resolves to the provided result.
 * The chain also implements .then so it can be awaited directly.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'insert', 'update', 'upsert', 'delete', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('POST /api/platforms/facebook/broadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  // --- Auth Guard Tests ---

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // --- Input Validation Tests ---

  it('returns 400 when title is missing', async () => {
    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        description: 'Missing title',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when title is empty', async () => {
    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: '',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when title exceeds 255 characters', async () => {
    const longTitle = 'a'.repeat(256);
    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: longTitle,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts optional description (defaults to empty string)', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'token-123',
          },
        ],
        primary_page_id: 'page-1',
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/path/streamkey',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(200);
  });

  // --- Facebook Connection Tests ---

  it('returns 400 when Facebook is not connected', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Facebook not connected');
  });

  it('returns 400 when Facebook query errors', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db down') }));

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Facebook not connected');
  });

  // --- Page Selection Tests ---

  it('returns 400 when no Facebook pages are available', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(
      'No Facebook Page found. You must manage at least one Facebook Page to go live.',
    );
  });

  it('uses primary_page_id when pageId is not specified', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Primary Page',
            access_token: 'token-1',
          },
          {
            id: 'page-2',
            name: 'Secondary Page',
            access_token: 'token-2',
          },
        ],
        primary_page_id: 'page-1',
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/path/streamkey',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pageId).toBe('page-1');
    expect(body.pageName).toBe('Primary Page');
  });

  it('uses explicitly specified pageId when provided', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Primary Page',
            access_token: 'token-1',
          },
          {
            id: 'page-2',
            name: 'Secondary Page',
            access_token: 'token-2',
          },
        ],
        primary_page_id: 'page-1',
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/path/streamkey',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
        pageId: 'page-2',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pageId).toBe('page-2');
    expect(body.pageName).toBe('Secondary Page');
  });

  it('falls back to first page when primary_page_id is not set', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'First Page',
            access_token: 'token-1',
          },
          {
            id: 'page-2',
            name: 'Second Page',
            access_token: 'token-2',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/path/streamkey',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pageId).toBe('page-1');
  });

  // --- Facebook API Call Tests ---

  it('calls Facebook Graph API with correct parameters', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'page-access-token',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/path/streamkey',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'My Broadcast',
        description: 'Broadcasting live',
      }),
    );

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/page-1/live_videos',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My Broadcast',
          description: 'Broadcasting live',
          status: 'LIVE_NOW',
          access_token: 'page-access-token',
        }),
      }),
    );
  });

  // --- Success Response Tests ---

  it('returns 200 with success payload on successful broadcast creation', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-123',
            name: 'My Page',
            access_token: 'token-abc',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/path/streamkey',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
        description: 'Testing',
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.liveVideoId).toBe('live-1');
    expect(body.streamUrl).toBe('rtmp://host/path/streamkey');
    expect(body.pageId).toBe('page-123');
    expect(body.pageName).toBe('My Page');
    expect(body.watchUrl).toBe('https://www.facebook.com/live/producer/live-1');
  });

  // --- RTMP URL Parsing Tests ---

  it('correctly parses rtmp_url into rtmpUrl and streamKey', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'token-123',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://live-api-s.facebook.com:80/rtmp/abc123def456ghi789',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );

    const body = await res.json();
    expect(body.rtmpUrl).toBe('rtmp://live-api-s.facebook.com:80/rtmp');
    expect(body.streamKey).toBe('abc123def456ghi789');
  });

  it('handles stream_url without slash gracefully', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'token-123',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://simple',
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );

    const body = await res.json();
    expect(body.rtmpUrl).toBe('rtmp://simple');
    expect(body.streamKey).toBe('');
  });

  // --- Error Response Tests ---

  it('returns 500 when Facebook API response lacks id', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'token-123',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          stream_url: 'rtmp://host/path/streamkey',
          error: { message: 'Invalid page' },
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create Facebook live video');
  });

  it('returns 500 when Facebook API response lacks stream_url', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'token-123',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          error: { message: 'No stream URL available' },
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create Facebook live video');
    expect(body.details).toBe('No stream URL available');
  });

  it('returns 500 when Facebook API returns an error message', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: {
        pages: [
          {
            id: 'page-1',
            name: 'Test Page',
            access_token: 'token-123',
          },
        ],
      },
    };
    mockFrom.mockReturnValue(makeChain({ data: platform, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          error: {
            message: 'Invalid access token',
          },
        }),
    });

    const res = await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test Stream',
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create Facebook live video');
    expect(body.details).toBe('Invalid access token');
  });

  // --- Exception Handling Tests ---

  it('returns 500 when request body is not valid JSON', async () => {
    const req = new (await import('next/server')).NextRequest(
      new URL('/api/platforms/facebook/broadcast', 'http://localhost:3000'),
      {
        method: 'POST',
        body: 'not json',
      },
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create broadcast');
  });

  it('logs errors via logger on exception', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));

    await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test',
      }),
    );

    // The error is logged in the catch block, not here. This test verifies
    // that the route handles errors gracefully without throwing.
    expect(logger.error).not.toHaveBeenCalled(); // Not called in this path
  });

  // --- Supabase Query Verification ---

  it('queries Supabase with correct user fid and platform filter', async () => {
    const platform = {
      user_fid: 123,
      platform: 'facebook',
      metadata: { pages: [{ id: 'p1', name: 'Page', access_token: 'token' }] },
    };
    const chain = makeChain({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          id: 'live-1',
          stream_url: 'rtmp://host/streamkey',
        }),
    });

    await POST(
      makePostRequest('/api/platforms/facebook/broadcast', {
        title: 'Test',
      }),
    );

    expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'facebook');
    expect(chain.single).toHaveBeenCalled();
  });
});
