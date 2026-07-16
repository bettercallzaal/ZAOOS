import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';
import { GET } from '../route';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

const { mockGetAuthUrl } = vi.hoisted(() => ({
  mockGetAuthUrl: vi.fn(),
}));

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/music/lastfm', () => ({
  getAuthUrl: mockGetAuthUrl,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/auth/lastfm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  // ── Authentication ────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when session is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session.fid is falsy (0)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 0 }));

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('allows authenticated session with valid fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  // ── Supabase query chain ──────────────────────────────────────────────────

  describe('supabase user_settings query', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('queries user_settings table with correct fid', async () => {
      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(supabaseChain.chain.select).toHaveBeenCalledWith('lastfm_session_key');
      expect(supabaseChain.chain.eq).toHaveBeenCalledWith('fid', 456);
      expect(supabaseChain.chain.single).toHaveBeenCalled();
    });

    it('chains query methods in correct order', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: 'session123' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      // Verify chain is called: from().select().eq().single()
      expect(mockFrom).toHaveBeenCalledBefore(supabaseChain.chain.select);
      expect(supabaseChain.chain.select).toHaveBeenCalledBefore(supabaseChain.chain.eq);
      expect(supabaseChain.chain.eq).toHaveBeenCalledBefore(supabaseChain.chain.single);
    });
  });

  // ── Connected status (already has Last.fm session) ────────────────────────

  describe('connected status (lastfm_session_key present)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    });

    it('returns connected=true when lastfm_session_key exists', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: 'existing_session_key_abc123' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(true);
      expect(body.connectUrl).toBeNull();
    });

    it('does not call getAuthUrl when already connected', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: 'existing_key' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      expect(mockGetAuthUrl).not.toHaveBeenCalled();
    });

    it('returns connectUrl=null when already connected', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: 'some_key' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      const body = await res.json();
      expect(body.connectUrl).toBeNull();
    });
  });

  // ── Not connected (needs auth URL) ────────────────────────────────────────

  describe('not connected (no lastfm_session_key)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 101 }));
    });

    it('returns connected=false when lastfm_session_key is missing', async () => {
      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue(
        'https://www.last.fm/api/auth/?api_key=test&cb=http://localhost:3000/api/auth/lastfm/callback',
      );

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(false);
    });

    it('calls getAuthUrl with callback URL', async () => {
      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      expect(mockGetAuthUrl).toHaveBeenCalledWith('http://localhost:3000/api/auth/lastfm/callback');
    });

    it('uses NEXT_PUBLIC_APP_URL env var for callback if set', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      expect(mockGetAuthUrl).toHaveBeenCalledWith('https://example.com/api/auth/lastfm/callback');
    });

    it('falls back to localhost:3000 when NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      expect(mockGetAuthUrl).toHaveBeenCalledWith('http://localhost:3000/api/auth/lastfm/callback');
    });

    it('returns connectUrl from getAuthUrl', async () => {
      const expectedUrl =
        'https://www.last.fm/api/auth/?api_key=test_key&cb=http://localhost:3000/api/auth/lastfm/callback';

      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue(expectedUrl);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      const body = await res.json();
      expect(body.connectUrl).toBe(expectedUrl);
    });
  });

  // ── Edge case: user_settings has null lastfm_session_key ──────────────────

  describe('edge case: lastfm_session_key is null', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 202 }));
    });

    it('treats null lastfm_session_key as not connected', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: null },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      const body = await res.json();
      expect(body.connected).toBe(false);
      expect(body.connectUrl).toBeTruthy();
      expect(mockGetAuthUrl).toHaveBeenCalled();
    });

    it('treats empty string lastfm_session_key as not connected', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: '' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      const body = await res.json();
      expect(body.connected).toBe(false);
      expect(mockGetAuthUrl).toHaveBeenCalled();
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 303 }));
    });

    it('returns 500 when supabase query throws', async () => {
      const supabaseChain = chainMock({});
      mockFrom.mockReturnValue(supabaseChain.chain);
      supabaseChain.chain.single.mockRejectedValue(new Error('Supabase connection failed'));

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to check status');
      expect(mockLoggerError).toHaveBeenCalled();
    });

    it('returns 500 when getSessionData throws', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session read error'));

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to check status');
      expect(mockLoggerError).toHaveBeenCalled();
    });

    it('returns 500 when getAuthUrl throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 404 }));

      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockImplementation(() => {
        throw new Error('Last.fm API key missing');
      });

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to check status');
      expect(mockLoggerError).toHaveBeenCalled();
    });

    it('logs error details when exception occurs', async () => {
      const testError = new Error('Detailed error message');
      mockGetSessionData.mockRejectedValue(testError);

      const req = makeGetRequest('/api/auth/lastfm');
      await GET(req);

      expect(mockLoggerError).toHaveBeenCalledWith('[lastfm/status] Error:', testError);
    });

    it('handles non-Error thrown values', async () => {
      const supabaseChain = chainMock({});
      mockFrom.mockReturnValue(supabaseChain.chain);
      supabaseChain.chain.single.mockRejectedValue('string error');

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to check status');
    });
  });

  // ── Response shape ────────────────────────────────────────────────────────

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 505 }));
    });

    it('returns JSON with connected and connectUrl fields (not connected)', async () => {
      const authUrl = 'https://www.last.fm/api/auth/?api_key=key&cb=callback';
      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue(authUrl);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('connected');
      expect(body).toHaveProperty('connectUrl');
      expect(Object.keys(body)).toHaveLength(2);
      expect(body.connected).toBe(false);
      expect(body.connectUrl).toBe(authUrl);
    });

    it('returns JSON with connected and connectUrl fields (connected)', async () => {
      const supabaseChain = chainMock({
        data: { lastfm_session_key: 'key' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('connected');
      expect(body).toHaveProperty('connectUrl');
      expect(Object.keys(body)).toHaveLength(2);
      expect(body.connected).toBe(true);
      expect(body.connectUrl).toBeNull();
    });

    it('returns content-type: application/json on success', async () => {
      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);
      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('returns content-type: application/json on error', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session error'));

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  // ── Integration scenario ──────────────────────────────────────────────────

  describe('integration scenarios', () => {
    it('complete flow: user not connected → returns auth URL', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 606 }));

      const supabaseChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);

      const expectedUrl =
        'https://www.last.fm/api/auth/?api_key=abc&cb=http://localhost:3000/api/auth/lastfm/callback';
      mockGetAuthUrl.mockReturnValue(expectedUrl);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(false);
      expect(body.connectUrl).toBe(expectedUrl);

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(supabaseChain.chain.select).toHaveBeenCalledWith('lastfm_session_key');
      expect(supabaseChain.chain.eq).toHaveBeenCalledWith('fid', 606);
      expect(mockGetAuthUrl).toHaveBeenCalledWith('http://localhost:3000/api/auth/lastfm/callback');
    });

    it('complete flow: user already connected → no auth URL', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 707 }));

      const supabaseChain = chainMock({
        data: { lastfm_session_key: 'user_session_xyz' },
        error: null,
      });
      mockFrom.mockReturnValue(supabaseChain.chain);

      const req = makeGetRequest('/api/auth/lastfm');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(true);
      expect(body.connectUrl).toBeNull();

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(mockGetAuthUrl).not.toHaveBeenCalled();
    });

    it('handles multiple sequential requests with different fids', async () => {
      const supabaseChain1 = chainMock({
        data: null,
        error: null,
      });
      const supabaseChain2 = chainMock({
        data: { lastfm_session_key: 'key' },
        error: null,
      });

      mockFrom.mockReturnValueOnce(supabaseChain1.chain).mockReturnValueOnce(supabaseChain2.chain);

      mockGetAuthUrl.mockReturnValue('https://www.last.fm/api/auth/?api_key=test&cb=...');

      // First request: fid=808, not connected
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 808 }));
      let req = makeGetRequest('/api/auth/lastfm');
      let res = await GET(req);
      expect((await res.json()).connected).toBe(false);

      // Second request: fid=909, already connected
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 909 }));
      req = makeGetRequest('/api/auth/lastfm');
      res = await GET(req);
      expect((await res.json()).connected).toBe(true);

      expect(supabaseChain1.chain.eq).toHaveBeenCalledWith('fid', 808);
      expect(supabaseChain2.chain.eq).toHaveBeenCalledWith('fid', 909);
    });
  });
});
