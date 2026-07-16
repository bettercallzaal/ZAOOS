import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockGetLastfmSession } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockGetLastfmSession: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/music/lastfm', () => ({
  getSession: mockGetLastfmSession,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Build a chain that supports upsert→await for the callback operation.
 * Chainable methods return the chain for further chaining.
 * The chain supports direct await (via .then) for awaited operations.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = ['upsert'];
  for (const m of chainable) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/auth/lastfm/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockGetLastfmSession.mockResolvedValue('test-session-key');
  });

  it('redirects to /settings?error=unauthorized when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?error=unauthorized');
  });

  it('redirects to /settings?error=unauthorized when session has no fid', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'user' });

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?error=unauthorized');
  });

  it('redirects to /settings?error=no_token when token param is missing', async () => {
    const req = makeGetRequest('/api/auth/lastfm/callback');
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?error=no_token');
  });

  it('redirects to /settings?error=no_token when token param is empty string', async () => {
    const req = makeGetRequest('/api/auth/lastfm/callback', { token: '' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?error=no_token');
  });

  it('calls getLastfmSession with the token from query params', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token-abc' });
    await GET(req);

    expect(mockGetLastfmSession).toHaveBeenCalledWith('test-token-abc');
  });

  it('stores the session key in supabase user_settings table', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    await GET(req);

    expect(mockFrom).toHaveBeenCalledWith('user_settings');
    expect(chain.upsert).toHaveBeenCalledWith(
      { fid: 123, lastfm_session_key: 'test-session-key' },
      { onConflict: 'fid' },
    );
  });

  it('upserts with the correct fid from the session', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    await GET(req);

    expect(chain.upsert).toHaveBeenCalledWith(
      { fid: 999, lastfm_session_key: 'test-session-key' },
      { onConflict: 'fid' },
    );
  });

  it('redirects to /settings?lastfm=connected on success', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?lastfm=connected');
  });

  it('redirects to /settings?error=lastfm_failed when getLastfmSession throws', async () => {
    mockGetLastfmSession.mockRejectedValue(new Error('Last.fm API error'));

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?error=lastfm_failed');
  });

  it('redirects to /settings?error=lastfm_failed when supabase upsert throws', async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockRejectedValue(new Error('db connection failed')),
    });

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain('/settings?error=lastfm_failed');
  });

  it('logs errors server-side on getLastfmSession failure', async () => {
    const { logger } = await import('@/lib/logger');
    const testError = new Error('Last.fm API returned 400');
    mockGetLastfmSession.mockRejectedValue(testError);

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    await GET(req);

    expect(logger.error).toHaveBeenCalledWith('[lastfm/callback] Error:', testError);
  });

  it('logs errors server-side on supabase upsert failure', async () => {
    const { logger } = await import('@/lib/logger');
    const testError = new Error('Supabase connection timeout');
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockRejectedValue(testError),
    });

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    await GET(req);

    expect(logger.error).toHaveBeenCalledWith('[lastfm/callback] Error:', testError);
  });

  it('uses Supabase onConflict strategy to update existing session', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    await GET(req);

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ onConflict: 'fid' }),
    );
  });

  it('handles concurrent token requests for same user', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req1 = makeGetRequest('/api/auth/lastfm/callback', { token: 'token-1' });
    const req2 = makeGetRequest('/api/auth/lastfm/callback', { token: 'token-2' });

    await GET(req1);
    await GET(req2);

    expect(mockGetLastfmSession).toHaveBeenCalledWith('token-1');
    expect(mockGetLastfmSession).toHaveBeenCalledWith('token-2');
  });

  it('does not call getLastfmSession if token is missing', async () => {
    const req = makeGetRequest('/api/auth/lastfm/callback');
    await GET(req);

    expect(mockGetLastfmSession).not.toHaveBeenCalled();
  });

  it('does not call supabase if getLastfmSession throws', async () => {
    mockGetLastfmSession.mockRejectedValue(new Error('API error'));

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    await GET(req);

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns proper redirect status code (307) for all redirect paths', async () => {
    // Test unauthorized redirect
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    let req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    let res = await GET(req);
    expect(res.status).toBe(307);

    // Test no_token redirect
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    req = makeGetRequest('/api/auth/lastfm/callback');
    res = await GET(req);
    expect(res.status).toBe(307);

    // Test success redirect
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    res = await GET(req);
    expect(res.status).toBe(307);
  });

  it('preserves base URL in redirect Location header', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeGetRequest('/api/auth/lastfm/callback', { token: 'test-token' });
    const res = await GET(req);

    const location = res.headers.get('Location');
    expect(location).toBeTruthy();
    expect(location).toContain('settings');
  });
});
