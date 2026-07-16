import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.stubGlobal('fetch', vi.fn());

// Set required environment variables for Kick OAuth
process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
process.env.KICK_CLIENT_SECRET = 'test-kick-secret';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

import { GET } from '../route';

/**
 * Make a Supabase chain mock that supports upsert() and optional terminal methods.
 */
function makeUpsertChain(result: { data?: unknown; error?: unknown | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.upsert = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = vi.fn((resolve: (v: unknown) => void) =>
    resolve(result),
  );
  return chain;
}

describe('GET /api/auth/kick/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
  });

  describe('Authentication checks', () => {
    it('redirects to /settings when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings');
    });
  });

  describe('Query parameter validation', () => {
    it('redirects to /settings?error=kick_denied when ?code is missing', async () => {
      const req = makeGetRequest('/api/auth/kick/callback');
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_denied');
    });

    it('redirects to /settings?error=kick_denied when ?code is empty', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: '' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_denied');
    });
  });

  describe('Environment variable validation', () => {
    it('redirects to /settings?error=kick_config when NEXT_PUBLIC_KICK_CLIENT_ID is missing', async () => {
      const originalClientId = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_config');
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = originalClientId;
    });

    it('redirects to /settings?error=kick_config when KICK_CLIENT_SECRET is missing', async () => {
      const originalSecret = process.env.KICK_CLIENT_SECRET;
      delete process.env.KICK_CLIENT_SECRET;
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_config');
      process.env.KICK_CLIENT_SECRET = originalSecret;
    });
  });

  describe('PKCE verifier validation', () => {
    it('redirects to /settings?error=kick_pkce when PKCE cookie is missing', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_pkce');
    });

    it('redirects to /settings?error=kick_pkce when PKCE cookie is empty', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', '');
      const res = await GET(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_pkce');
    });
  });

  describe('Token exchange', () => {
    it('exchanges code + verifier for access token', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              access_token: 'test-access-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (call: unknown[]) => (call[0] as string).includes('id.kick.com/oauth/token'),
      );
      expect(tokenCall).toBeDefined();
      expect(tokenCall[0]).toBe('https://id.kick.com/oauth/token');
      expect(tokenCall[1].method).toBe('POST');
      expect(tokenCall[1].headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      const callBody = (tokenCall[1].body as unknown).toString();
      expect(callBody).toContain('code=test-code');
      expect(callBody).toContain('code_verifier=test-verifier');
      expect(callBody).toContain('client_id=test-kick-client-id');
      expect(callBody).toContain('client_secret=test-kick-secret');
    });

    it('redirects to /settings?error=kick_token when token response lacks access_token', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_token');
    });
  });

  describe('User fetch with fallback endpoints', () => {
    it('fetches user from first endpoint on success', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'testuser', name: 'Test User' }],
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const userFetchCall = fetchCalls.find((call: unknown[]) =>
        (call[0] as string).includes('api.kick.com'),
      );
      expect(userFetchCall[0]).toBe('https://api.kick.com/public/v1/users');
    });

    it('tries second endpoint when first fails', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: false,
            json: vi.fn().mockResolvedValue({}),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { id: '456', username: 'testuser', name: 'Test User' },
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const userFetchCalls = fetchCalls.filter((call: unknown[]) =>
        (call[0] as string).includes('api.kick.com'),
      );
      expect(userFetchCalls.length).toBeGreaterThanOrEqual(2);
      expect(userFetchCalls[0][0]).toBe('https://api.kick.com/public/v1/users');
      expect(userFetchCalls[1][0]).toBe('https://api.kick.com/public/v1/users/me');
    });

    it('extracts user from nested data array', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '789', username: 'testuser', name: 'Test User', user_id: '789' }],
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].platform_user_id).toBe('789');
    });

    it('redirects to /settings?error=kick_user when all user endpoints fail', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        return {
          ok: false,
          json: vi.fn().mockResolvedValue({}),
        };
      });

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_user');
    });

    it('redirects to /settings?error=kick_user when user lacks id and user_id', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: [{ username: 'testuser' }] }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_user');
    });

    it('accepts user_id as fallback for id', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ user_id: '999', username: 'testuser', name: 'Test User' }],
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].platform_user_id).toBe('999');
    });
  });

  describe('Username and display name extraction', () => {
    it('uses username for display name when name is absent', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'streamer_name' }],
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].platform_display_name).toBe('streamer_name');
    });

    it('falls back to slug when username is absent', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', slug: 'user-slug', name: 'Full Name' }],
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].platform_username).toBe('user-slug');
    });

    it('uses display_name when name is absent', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'test', display_name: 'Display Name' }],
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].platform_display_name).toBe('Display Name');
    });
  });

  describe('Channel info fetch', () => {
    it('fetches channel info from /api/kick.com/public/v1/channels/me', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token', expires_in: 3600 }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { stream_key: 'live_key_123', rtmp_url: 'rtmps://ingest.example.com' },
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const channelCall = fetchCalls.find((call: unknown[]) =>
        (call[0] as string).includes('channels/me'),
      );
      expect(channelCall).toBeDefined();
      expect(channelCall[0]).toBe('https://api.kick.com/public/v1/channels/me');
      expect(channelCall[1].headers.Authorization).toBe('Bearer test-token');
    });

    it('uses streaming_key as fallback when stream_key is absent', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { streaming_key: 'alt_key_456' },
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].stream_key).toBe('alt_key_456');
    });

    it('uses ingest_url as fallback when rtmp_url is absent', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { stream_key: 'key', ingest_url: 'rtmps://custom.ingest.net' },
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].rtmp_url).toBe('rtmps://custom.ingest.net');
    });

    it('uses well-known RTMP URL as fallback', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: '123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = mockFrom.mock.results[0].value.upsert.mock.calls[0];
      expect(upsertCall[0].rtmp_url).toBe(
        'rtmps://fa723fc1b171.global-contribute.live-video.net/app',
      );
    });
  });

  describe('Supabase upsert', () => {
    it('upserts to connected_platforms with correct structure', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              access_token: 'test-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser', name: 'Test User' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { stream_key: 'stream_key_123' },
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
      const upsertCall = chain.upsert.mock.calls[0];
      expect(upsertCall[0]).toEqual({
        user_fid: 123,
        platform: 'kick',
        platform_user_id: 'user123',
        platform_username: 'testuser',
        platform_display_name: 'Test User',
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        stream_key: 'stream_key_123',
        rtmp_url: 'rtmps://fa723fc1b171.global-contribute.live-video.net/app',
        scopes: 'user:read channel:read channel:write',
        expires_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
      expect(upsertCall[1]).toEqual({
        onConflict: 'user_fid,platform',
      });
    });

    it('sets expires_at when expires_in is provided', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      const beforeTime = Date.now();
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              access_token: 'test-token',
              expires_in: 7200,
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = chain.upsert.mock.calls[0];
      const expiresAt = new Date(upsertCall[0].expires_at as string).getTime();
      const expectedExpiresAt = beforeTime + 7200 * 1000;
      expect(Math.abs(expiresAt - expectedExpiresAt)).toBeLessThan(1000); // Within 1 second
    });

    it('sets expires_at to null when expires_in is absent', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = chain.upsert.mock.calls[0];
      expect(upsertCall[0].expires_at).toBeNull();
    });

    it('sets refresh_token to null when not provided', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const upsertCall = chain.upsert.mock.calls[0];
      expect(upsertCall[0].refresh_token).toBeNull();
    });

    it('redirects to /settings?error=kick_save when upsert errors', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: new Error('DB constraint violation') });
      mockFrom.mockReturnValue(chain);

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_save');
    });
  });

  describe('Success flow', () => {
    it('redirects to /settings?connected=kick on successful connection', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              access_token: 'test-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser', name: 'Test User' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: { stream_key: 'stream_key_123' },
            }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?connected=kick');
    });

    it('clears the PKCE verifier cookie on success', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('kick_pkce_verifier');
      expect(setCookieHeader).toContain('Max-Age=0');
    });
  });

  describe('Exception handling', () => {
    it('redirects to /settings?error=kick_unknown on fetch exception', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_unknown');
    });

    it('redirects to /settings?error=kick_unknown on JSON parse error', async () => {
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValueOnce(new SyntaxError('Invalid JSON')),
      });

      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings?error=kick_unknown');
    });
  });

  describe('Redirect URI construction', () => {
    it('uses NEXT_PUBLIC_BASE_URL when set', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://custom.domain.com';
      const req = makeGetRequest('/api/auth/kick/callback', { code: 'test-code' });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const callBody = (tokenCall[1].body as unknown).toString();
      expect(callBody).toContain(
        'redirect_uri=https%3A%2F%2Fcustom.domain.com%2Fapi%2Fauth%2Fkick%2Fcallback',
      );

      process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    });

    it('falls back to request origin when NEXT_PUBLIC_BASE_URL is unset', async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
      const req = makeGetRequest('http://example.com/api/auth/kick/callback', {
        code: 'test-code',
      });
      req.cookies.set('kick_pkce_verifier', 'test-verifier');
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        if (url === 'https://id.kick.com/oauth/token') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/users') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({
              data: [{ id: 'user123', username: 'testuser' }],
            }),
          };
        }
        if (url === 'https://api.kick.com/public/v1/channels/me') {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ data: { stream_key: 'key' } }),
          };
        }
        return { ok: true, json: vi.fn().mockResolvedValue({}) };
      });
      const chain = makeUpsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await GET(req);

      const tokenCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const callBody = (tokenCall[1].body as unknown).toString();
      expect(callBody).toContain(
        'redirect_uri=http%3A%2F%2Fexample.com%2Fapi%2Fauth%2Fkick%2Fcallback',
      );

      process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    });
  });
});
