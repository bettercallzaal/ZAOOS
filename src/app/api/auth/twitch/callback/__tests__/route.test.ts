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

vi.stubGlobal('fetch', vi.fn());

// Mock environment variables
process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = 'test-twitch-client-id';
process.env.TWITCH_CLIENT_SECRET = 'test-twitch-secret';

import { GET } from '../route';

/**
 * Chain whose chainable methods are inspectable spies.
 * Resolves both via .then() and as awaited value for upsert chains.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'update', 'eq', 'upsert']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/auth/twitch/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('redirects to /settings when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings');
  });

  it('redirects to /settings?error=twitch_denied when code is missing', async () => {
    const req = makeGetRequest('/api/auth/twitch/callback', {});
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=twitch_denied');
  });

  it('redirects to /settings?error=twitch_denied when code is explicitly denied', async () => {
    const req = makeGetRequest('/api/auth/twitch/callback', { error: 'access_denied' });
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=twitch_denied');
  });

  it('redirects to /settings?error=twitch_config when NEXT_PUBLIC_TWITCH_CLIENT_ID is missing', async () => {
    const savedClientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    try {
      const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/settings?error=twitch_config',
      );
    } finally {
      process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = savedClientId;
    }
  });

  it('redirects to /settings?error=twitch_config when TWITCH_CLIENT_SECRET is missing', async () => {
    const savedSecret = process.env.TWITCH_CLIENT_SECRET;
    delete process.env.TWITCH_CLIENT_SECRET;
    try {
      const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/settings?error=twitch_config',
      );
    } finally {
      process.env.TWITCH_CLIENT_SECRET = savedSecret;
    }
  });

  it('redirects to /settings?error=twitch_token when token exchange fails (no access_token)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ error: 'invalid_code' }),
    });
    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'bad-code' });
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=twitch_token');
  });

  it('redirects to /settings?error=twitch_user when user fetch returns no data', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ data: [] }),
      });
    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=twitch_user');
  });

  it('successfully exchanges code, fetches user, fetches stream key, and stores connection', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ stream_key: 'live_12345_abc123' }],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?connected=twitch');

    // Verify token endpoint call
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://id.twitch.tv/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    // Verify upsert was called with correct data
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_fid: 123,
        platform: 'twitch',
        platform_user_id: '12345',
        platform_username: 'testuser',
        platform_display_name: 'TestUser',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        stream_key: 'live_12345_abc123',
        rtmp_url: 'rtmp://live.twitch.tv/app',
        scopes: 'channel:read:stream_key channel:manage:broadcast chat:read',
      }),
      { onConflict: 'user_fid,platform' },
    );
  });

  it('handles stream key as empty string when not provided by Twitch', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: null,
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?connected=twitch');

    // Verify upsert called with empty stream key
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stream_key: '',
      }),
      { onConflict: 'user_fid,platform' },
    );
  });

  it('sets expires_at to null when token has no expires_in', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: null,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ stream_key: 'live_key' }],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    await GET(req);

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: null,
      }),
      { onConflict: 'user_fid,platform' },
    );
  });

  it('redirects to /settings?error=twitch_save when database upsert fails', async () => {
    const chain = makeChain({ error: new Error('unique constraint failed') });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: null,
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ stream_key: 'live_key' }],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=twitch_save');
  });

  it('redirects to /settings?error=twitch_unknown when an unexpected error occurs', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=twitch_unknown');
  });

  it('correctly constructs the token exchange URLSearchParams', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ stream_key: 'live_key' }],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'my-auth-code' });
    await GET(req);

    const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(tokenCall[0]).toBe('https://id.twitch.tv/oauth2/token');
    expect(tokenCall[1].method).toBe('POST');

    const body = new URLSearchParams(tokenCall[1].body);
    expect(body.get('client_id')).toBe('test-twitch-client-id');
    expect(body.get('client_secret')).toBe('test-twitch-secret');
    expect(body.get('code')).toBe('my-auth-code');
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('redirect_uri')).toBe('https://zaoos.com/api/auth/twitch/callback');
  });

  it('includes Authorization and Client-Id headers in user fetch', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: null,
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ stream_key: 'live_key' }],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    await GET(req);

    const userCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(userCall[0]).toBe('https://api.twitch.tv/helix/users');
    expect(userCall[1].headers).toEqual({
      Authorization: 'Bearer test-access-token',
      'Client-Id': 'test-twitch-client-id',
    });
  });

  it('includes Authorization and Client-Id headers in stream key fetch', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: null,
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [
            {
              id: '12345',
              login: 'testuser',
              display_name: 'TestUser',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({
          data: [{ stream_key: 'live_key' }],
        }),
      });

    const req = makeGetRequest('/api/auth/twitch/callback', { code: 'test-code' });
    await GET(req);

    const keyCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[2];
    expect(keyCall[0]).toBe('https://api.twitch.tv/helix/streams/key?broadcaster_id=12345');
    expect(keyCall[1].headers).toEqual({
      Authorization: 'Bearer test-access-token',
      'Client-Id': 'test-twitch-client-id',
    });
  });
});
