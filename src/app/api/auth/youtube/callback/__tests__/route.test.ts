import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.stubGlobal('fetch', vi.fn());

// Set default env vars for all tests
process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test_client_id';
process.env.YOUTUBE_CLIENT_SECRET = 'test_client_secret';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

import { GET } from '../route';

/**
 * Build a Supabase chain mock that supports upsert().
 * Resolves when awaited directly.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['upsert', 'eq', 'select', 'order', 'limit', 'single']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/auth/youtube/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID = 'test_client_id';
    process.env.YOUTUBE_CLIENT_SECRET = 'test_client_secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  it('returns 302 redirect to /settings when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings');
  });

  it('returns 302 redirect to /settings?error=youtube_denied when code is missing', async () => {
    const res = await GET(makeGetRequest('/api/auth/youtube/callback'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=youtube_denied');
  });

  it('returns 302 redirect to /settings?error=youtube_config when NEXT_PUBLIC_YOUTUBE_CLIENT_ID is missing', async () => {
    delete process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=youtube_config');
  });

  it('returns 302 redirect to /settings?error=youtube_config when YOUTUBE_CLIENT_SECRET is missing', async () => {
    delete process.env.YOUTUBE_CLIENT_SECRET;
    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=youtube_config');
  });

  it('returns 302 redirect to /settings?error=youtube_token when token exchange fails (no access_token)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=invalid_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=youtube_token');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'YouTube token exchange failed:',
      expect.objectContaining({ error: 'invalid_grant' }),
    );
  });

  it('sends correct token exchange request to Google', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ access_token: 'valid_token', refresh_token: 'refresh_token' }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'channel_123',
              snippet: { title: 'Test Channel', customUrl: 'testchannel' },
            },
          ],
        }),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    // Verify token exchange call
    const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(tokenCall[0]).toBe('https://oauth2.googleapis.com/token');
    expect(tokenCall[1].method).toBe('POST');
    expect(tokenCall[1].headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
    // Body is URLSearchParams, convert to string for verification
    const bodyStr = new URLSearchParams(tokenCall[1].body).toString();
    expect(bodyStr).toContain('client_id=test_client_id');
    expect(bodyStr).toContain('code=auth_code');
    expect(bodyStr).toContain('grant_type=authorization_code');
  });

  it('returns 302 redirect to /settings?error=youtube_channel when channel fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ access_token: 'valid_token', refresh_token: 'refresh_token' }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ items: [] }),
    });

    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/settings?error=youtube_channel',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'YouTube channel fetch failed:',
      expect.objectContaining({ items: [] }),
    );
  });

  it('fetches channel info with correct authorization header', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({ access_token: 'test_access_token', refresh_token: 'refresh_token' }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'channel_123',
              snippet: { title: 'Test Channel', customUrl: 'testchannel' },
            },
          ],
        }),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    // Verify channel fetch call used the access token
    const channelCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(channelCall[0]).toContain('youtube/v3/channels');
    expect(channelCall[1].headers.Authorization).toBe('Bearer test_access_token');
  });

  it('returns 302 redirect to /settings?error=youtube_save when database upsert fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          access_token: 'valid_token',
          refresh_token: 'refresh_token',
          expires_in: 3600,
        }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'channel_123',
              snippet: { title: 'Test Channel', customUrl: 'testchannel' },
            },
          ],
        }),
    });

    const { chain } = { chain: makeChain({ error: new Error('db error') }) };
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=youtube_save');
    expect(mockLogger.error).toHaveBeenCalledWith('YouTube DB upsert error:', expect.any(Error));
  });

  it('correctly upserts to connected_platforms with all fields', async () => {
    const tokenData = {
      access_token: 'valid_token',
      refresh_token: 'refresh_token',
      expires_in: 3600,
    };
    const channelData = {
      items: [
        {
          id: 'channel_123',
          snippet: { title: 'Test Channel', customUrl: 'testchannel' },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(tokenData),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(channelData),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    const session = mockAuthenticatedSession({ fid: 456 });
    mockGetSessionData.mockResolvedValue(session);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_fid: 456,
        platform: 'youtube',
        platform_user_id: 'channel_123',
        platform_username: 'testchannel',
        platform_display_name: 'Test Channel',
        access_token: 'valid_token',
        refresh_token: 'refresh_token',
        stream_key: '',
        rtmp_url: 'rtmp://a.rtmp.youtube.com/live2',
        scopes: 'youtube youtube.force-ssl',
        expires_at: expect.stringContaining('2026'),
      }),
      { onConflict: 'user_fid,platform' },
    );
  });

  it('handles missing customUrl by falling back to channel id', async () => {
    const tokenData = {
      access_token: 'valid_token',
      refresh_token: 'refresh_token',
      expires_in: 3600,
    };
    const channelData = {
      items: [
        {
          id: 'channel_123',
          snippet: { title: 'Test Channel' },
          // Note: no customUrl
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(tokenData),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(channelData),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        platform_username: 'channel_123', // Falls back to channel id
      }),
      expect.anything(),
    );
  });

  it('handles null refresh_token from token exchange', async () => {
    const tokenData = { access_token: 'valid_token', refresh_token: null, expires_in: 3600 };
    const channelData = {
      items: [
        {
          id: 'channel_123',
          snippet: { title: 'Test Channel', customUrl: 'testchannel' },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(tokenData),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(channelData),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        refresh_token: null,
      }),
      expect.anything(),
    );
  });

  it('calculates expires_at correctly from expires_in', async () => {
    const tokenData = {
      access_token: 'valid_token',
      refresh_token: 'refresh_token',
      expires_in: 7200,
    };
    const channelData = {
      items: [
        {
          id: 'channel_123',
          snippet: { title: 'Test Channel', customUrl: 'testchannel' },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(tokenData),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(channelData),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    const beforeCall = Date.now();
    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    const afterCall = Date.now();

    const upsertCall = (chain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const expiresAt = new Date(upsertCall.expires_at).getTime();

    // Should be approximately 7200 seconds from now
    expect(expiresAt).toBeGreaterThanOrEqual(beforeCall + 7200000 - 1000); // -1s tolerance
    expect(expiresAt).toBeLessThanOrEqual(afterCall + 7200000 + 1000); // +1s tolerance
  });

  it('handles missing expires_in by setting expires_at to null', async () => {
    const tokenData = { access_token: 'valid_token', refresh_token: 'refresh_token' };
    // Note: no expires_in
    const channelData = {
      items: [
        {
          id: 'channel_123',
          snippet: { title: 'Test Channel', customUrl: 'testchannel' },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(tokenData),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(channelData),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: null,
      }),
      expect.anything(),
    );
  });

  it('returns 302 redirect to /settings?connected=youtube on success', async () => {
    const tokenData = {
      access_token: 'valid_token',
      refresh_token: 'refresh_token',
      expires_in: 3600,
    };
    const channelData = {
      items: [
        {
          id: 'channel_123',
          snippet: { title: 'Test Channel', customUrl: 'testchannel' },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(tokenData),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(channelData),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?connected=youtube');
  });

  it('returns 302 redirect to /settings?error=youtube_unknown when token fetch throws', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'));

    const res = await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/settings?error=youtube_unknown',
    );
    expect(mockLogger.error).toHaveBeenCalledWith('YouTube callback error:', expect.any(Error));
  });

  it('uses NEXT_PUBLIC_BASE_URL for redirectUri when set', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ access_token: 'valid_token', refresh_token: 'refresh_token' }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'channel_123',
              snippet: { title: 'Test Channel', customUrl: 'testchannel' },
            },
          ],
        }),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const bodyStr = new URLSearchParams(tokenCall[1].body).toString();
    expect(bodyStr).toContain(
      'redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fauth%2Fyoutube%2Fcallback',
    );
  });

  it('falls back to req.nextUrl.origin for redirectUri when NEXT_PUBLIC_BASE_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ access_token: 'valid_token', refresh_token: 'refresh_token' }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'channel_123',
              snippet: { title: 'Test Channel', customUrl: 'testchannel' },
            },
          ],
        }),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const bodyStr = new URLSearchParams(tokenCall[1].body).toString();
    expect(bodyStr).toContain(
      'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fyoutube%2Fcallback',
    );
  });

  it('logs token exchange failure with full response data', async () => {
    const errorResponse = {
      error: 'invalid_grant',
      error_description: 'Authorization code expired',
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(errorResponse),
    });

    await GET(makeGetRequest('/api/auth/youtube/callback?code=expired_code'));

    expect(mockLogger.error).toHaveBeenCalledWith('YouTube token exchange failed:', errorResponse);
  });

  it('logs channel fetch failure with full response data', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ access_token: 'valid_token' }),
    });

    const errorResponse = { error: { code: 403, message: 'Access not granted' } };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve(errorResponse),
    });

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    expect(mockLogger.error).toHaveBeenCalledWith('YouTube channel fetch failed:', errorResponse);
  });

  it('scopes upsert to onConflict key for idempotency', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ access_token: 'valid_token', refresh_token: 'refresh_token' }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          items: [
            {
              id: 'channel_123',
              snippet: { title: 'Test Channel', customUrl: 'testchannel' },
            },
          ],
        }),
    });

    const { chain } = { chain: makeChain({ error: null }) };
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/auth/youtube/callback?code=auth_code'));

    expect(chain.upsert).toHaveBeenCalledWith(expect.anything(), {
      onConflict: 'user_fid,platform',
    });
  });
});
