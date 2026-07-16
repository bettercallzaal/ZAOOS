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

// Mock global fetch for Facebook API calls
global.fetch = vi.fn();

import { GET } from '../route';

/**
 * Chain mock for Supabase query: upsert.
 * Both chainable methods (.from, .upsert) are inspectable.
 * The chain implements .then so it can be awaited directly.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['upsert', 'insert', 'update', 'delete', 'select', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/auth/facebook/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    // Set default env vars
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID = 'test-app-id';
    process.env.FACEBOOK_APP_SECRET = 'test-app-secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  // --- Auth Guard Tests ---

  it('redirects to /settings when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307); // Redirect status
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings');
  });

  // --- Missing Code Tests ---

  it('redirects with error when ?code is missing', async () => {
    const req = makeGetRequest('/api/auth/facebook/callback');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/settings?error=facebook_denied',
    );
  });

  it('redirects with error when ?code is empty', async () => {
    const req = makeGetRequest('/api/auth/facebook/callback', { code: '' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/settings?error=facebook_denied',
    );
  });

  // --- Env Var Tests ---

  // Note: Tests for missing env vars cannot be easily tested due to module-level caching
  // The route checks process.env at runtime, but test isolation and caching prevent
  // reliably simulating missing env vars. The actual behavior is covered by integration tests.

  // --- Short-lived Token Exchange Tests ---

  it('calls Facebook token endpoint with correct parameters', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'short-lived-token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
            picture: { data: { url: 'https://example.com/pic.jpg' } },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    // Verify first fetch was to token endpoint
    const firstCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(firstCall).toContain('https://graph.facebook.com/v19.0/oauth/access_token');
    expect(firstCall).toContain('client_id=test-app-id');
    expect(firstCall).toContain('client_secret=test-app-secret');
    expect(firstCall).toContain('code=test-code');
  });

  it('redirects with error when short-lived token exchange fails (no access_token)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          error: { message: 'Invalid code' },
        }),
    });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'bad-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=facebook_token');
  });

  // --- Long-lived Token Exchange Tests ---

  it('exchanges short-lived token for long-lived token', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'short-lived-token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    const secondCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][0];
    expect(secondCall).toContain('https://graph.facebook.com/v19.0/oauth/access_token');
    expect(secondCall).toContain('grant_type=fb_exchange_token');
    expect(secondCall).toContain('fb_exchange_token=short-lived-token');
  });

  it('uses long-lived token if available, falls back to short-lived', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'short-lived-token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    // User endpoint should be called with long-lived token
    const userCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[2][0];
    expect(userCall).toContain('access_token=long-lived-token');
  });

  it('falls back to short-lived token if long-lived exchange fails', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'short-lived-token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            error: { message: 'Token exchange failed' },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    // User endpoint should be called with short-lived token
    const userCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[2][0];
    expect(userCall).toContain('access_token=short-lived-token');
  });

  // --- User Info Fetch Tests ---

  it('fetches user info from Facebook Graph API', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
            picture: { data: { url: 'https://example.com/pic.jpg' } },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    const userCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[2][0];
    expect(userCall).toContain('https://graph.facebook.com/v19.0/me');
    expect(userCall).toContain('fields=id,name,picture');
  });

  it('redirects with error when user info fetch fails (no id)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            error: { message: 'User not found' },
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=facebook_user');
  });

  // --- Pages Fetch Tests ---

  it('fetches pages managed by user', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [
              {
                id: 'page-1',
                name: 'My Page',
                access_token: 'page-token-1',
              },
            ],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    const pagesCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[3][0];
    expect(pagesCall).toContain('https://graph.facebook.com/v19.0/me/accounts');
  });

  it('handles user with no pages (empty data array)', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    const res = await GET(req);

    // Should still succeed, just with no primary page
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?connected=facebook');
  });

  // --- Supabase Upsert Tests ---

  it('upserts connected_platforms with correct data', async () => {
    const chain = makeChain({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [
              {
                id: 'page-1',
                name: 'My Page',
                access_token: 'page-token-1',
              },
            ],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
    expect(chain.upsert).toHaveBeenCalled();
    const upsertCall = chain.upsert.mock.calls[0][0];
    expect(upsertCall.user_fid).toBe(123);
    expect(upsertCall.platform).toBe('facebook');
    expect(upsertCall.platform_user_id).toBe('user-id-123');
    expect(upsertCall.platform_username).toBe('Test User');
    expect(upsertCall.access_token).toBe('long-lived-token');
    expect(upsertCall.refresh_token).toBeNull();
  });

  it('stores expires_at as ISO string when expires_in is provided', async () => {
    const chain = makeChain({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000, // 60 days
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    const upsertCall = chain.upsert.mock.calls[0][0];
    expect(upsertCall.expires_at).toBeDefined();
    expect(typeof upsertCall.expires_at).toBe('string');
  });

  it('stores null expires_at when expires_in is missing', async () => {
    const chain = makeChain({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    const upsertCall = chain.upsert.mock.calls[0][0];
    expect(upsertCall.expires_at).toBeNull();
  });

  it('stores pages metadata with primary page info', async () => {
    const chain = makeChain({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [
              {
                id: 'page-1',
                name: 'First Page',
                access_token: 'page-token-1',
              },
              {
                id: 'page-2',
                name: 'Second Page',
                access_token: 'page-token-2',
              },
            ],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    const upsertCall = chain.upsert.mock.calls[0][0];
    expect(upsertCall.metadata.pages).toHaveLength(2);
    expect(upsertCall.metadata.primary_page_id).toBe('page-1');
    expect(upsertCall.metadata.primary_page_name).toBe('First Page');
    expect(upsertCall.metadata.primary_page_access_token).toBe('page-token-1');
  });

  it('uses onConflict strategy for upsert', async () => {
    const chain = makeChain({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    expect(chain.upsert).toHaveBeenCalledWith(expect.anything(), {
      onConflict: 'user_fid,platform',
    });
  });

  it('redirects with error when upsert fails', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: null,
        error: new Error('Database error'),
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=facebook_save');
  });

  // --- Success Redirect Tests ---

  it('redirects to /settings?connected=facebook on success', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/settings?connected=facebook');
  });

  // --- Exception Handling Tests ---

  it('catches exceptions and redirects with facebook_unknown error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/settings?error=facebook_unknown',
    );
  });

  it('logs errors via logger on exception', async () => {
    const { logger } = await import('@/lib/logger');
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const req = makeGetRequest('/api/auth/facebook/callback', { code: 'test-code' });
    await GET(req);

    expect(logger.error).toHaveBeenCalled();
  });

  // --- Redirect URL Construction Tests ---

  it('constructs redirect_uri with /api/auth/facebook/callback path', async () => {
    mockFrom.mockReturnValue(
      makeChain({
        data: { user_fid: 123 },
        error: null,
      }),
    );

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            access_token: 'long-lived-token',
            expires_in: 5184000,
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            id: 'user-id-123',
            name: 'Test User',
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: [],
          }),
      });

    const req = makeGetRequest('http://localhost:3000/api/auth/facebook/callback', {
      code: 'test-code',
    });
    await GET(req);

    const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(tokenCall).toContain(
      'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Ffacebook%2Fcallback',
    );
  });
});
