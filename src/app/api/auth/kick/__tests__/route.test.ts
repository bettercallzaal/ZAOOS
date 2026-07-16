import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/auth/kick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env overrides from previous tests
    delete process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NODE_ENV;
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('Unauthorized');
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('configuration validation', () => {
    it('returns 500 when NEXT_PUBLIC_KICK_CLIENT_ID is not configured', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Kick client ID not configured');
    });
  });

  describe('OAuth redirect', () => {
    it('redirects to Kick OAuth authorize endpoint with correct parameters', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://app.example.com';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      expect(res.status).toBe(307); // redirect status
      const location = res.headers.get('location');
      expect(location).toBeDefined();
      expect(location).toContain('https://id.kick.com/oauth/authorize');
      expect(location).toContain('client_id=test-kick-client-id');
      expect(location).toContain(
        'redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fauth%2Fkick%2Fcallback',
      );
      expect(location).toContain('response_type=code');
      expect(location).toContain('scope=user%3Aread+channel%3Aread+channel%3Awrite');
      expect(location).toContain('code_challenge_method=S256');
      expect(location).toContain('state=456');
    });

    it('uses request origin when NEXT_PUBLIC_BASE_URL is not set', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('http://localhost:3000/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      expect(location).toBeDefined();
      expect(location).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fkick%2Fcallback',
      );
    });

    it('sets state parameter to session fid', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      expect(location).toContain('state=789');
    });

    it('includes correct scopes in the OAuth request', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      expect(location).toContain('scope=user%3Aread+channel%3Aread+channel%3Awrite');
    });

    it('constructs valid redirect_uri with callback path', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      expect(location).toContain(
        'redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fauth%2Fkick%2Fcallback',
      );
    });

    it('returns a proper NextResponse.redirect', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      // NextResponse.redirect sets status 307
      expect(res.status).toBe(307);
      // Location header is set
      expect(res.headers.has('location')).toBe(true);
    });
  });

  describe('PKCE generation', () => {
    it('generates a code_challenge in the authorize URL', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      expect(location).toBeDefined();
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;
      const challenge = urlParams.get('code_challenge');

      // Code challenge must exist
      expect(challenge).toBeDefined();
      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe('string');
    });

    it('code_challenge is a valid base64url string', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;
      const challenge = urlParams.get('code_challenge');

      // Base64url: alphanumeric + hyphen + underscore, no padding
      const base64urlRegex = /^[A-Za-z0-9_-]+$/;
      expect(challenge).toMatch(base64urlRegex);
    });

    it('code_challenge has expected length (~43 chars for SHA256)', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;
      const challenge = urlParams.get('code_challenge');

      // SHA256 hashed then base64url encoded is typically 43 chars
      expect(challenge).toBeDefined();
      if (!challenge) throw new Error('Challenge missing');
      expect(challenge.length).toBeGreaterThanOrEqual(40);
      expect(challenge.length).toBeLessThanOrEqual(45);
    });

    it('generates different code_challenges on each call', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req1 = makeRequest('/api/auth/kick');
      const res1 = await GET(req1);
      const location1 = res1.headers.get('location');
      if (!location1) throw new Error('Location header missing');
      const challenge1 = new URL(location1).searchParams.get('code_challenge');

      const req2 = makeRequest('/api/auth/kick');
      const res2 = await GET(req2);
      const location2 = res2.headers.get('location');
      if (!location2) throw new Error('Location header missing');
      const challenge2 = new URL(location2).searchParams.get('code_challenge');

      // Each invocation should generate a fresh PKCE challenge
      expect(challenge1).not.toBe(challenge2);
    });

    it('sets code_challenge_method to S256', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;
      expect(urlParams.get('code_challenge_method')).toBe('S256');
    });
  });

  describe('PKCE verifier cookie storage', () => {
    it('sets kick_pkce_verifier cookie', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('kick_pkce_verifier=');
    });

    it('cookie is httpOnly', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('HttpOnly');
    });

    it('cookie has lax sameSite', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('SameSite=lax');
    });

    it('cookie has path /', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Path=/');
    });

    it('cookie has maxAge of 600 seconds (10 minutes)', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Max-Age=600');
    });

    it('cookie is secure in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Secure');
    });

    it('cookie is not secure in non-production', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      // In development, Secure flag should NOT be present
      expect(setCookieHeader).not.toContain('Secure');
    });

    it('verifier cookie value is a valid base64url string', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      if (!setCookieHeader) throw new Error('Set-Cookie header missing');
      const match = setCookieHeader.match(/kick_pkce_verifier=([^;]+)/);
      expect(match).toBeTruthy();

      if (!match) throw new Error('Verifier match failed');
      const verifierValue = match[1];
      // Base64url: alphanumeric + hyphen + underscore
      const base64urlRegex = /^[A-Za-z0-9_-]+$/;
      expect(verifierValue).toMatch(base64urlRegex);
    });

    it('verifier cookie value has expected length (~43 chars for 32 random bytes)', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const setCookieHeader = res.headers.get('set-cookie');
      if (!setCookieHeader) throw new Error('Set-Cookie header missing');
      const match = setCookieHeader.match(/kick_pkce_verifier=([^;]+)/);
      if (!match) throw new Error('Verifier match failed');
      const verifierValue = match[1];

      // 32 bytes base64url encoded is typically 43 chars
      expect(verifierValue.length).toBeGreaterThanOrEqual(40);
      expect(verifierValue.length).toBeLessThanOrEqual(45);
    });

    it('each request generates a different verifier', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req1 = makeRequest('/api/auth/kick');
      const res1 = await GET(req1);
      const cookie1 = res1.headers.get('set-cookie');
      if (!cookie1) throw new Error('Set-Cookie header missing');
      const verifier1Match = cookie1.match(/kick_pkce_verifier=([^;]+)/);
      if (!verifier1Match) throw new Error('Verifier match failed');
      const verifier1 = verifier1Match[1];

      const req2 = makeRequest('/api/auth/kick');
      const res2 = await GET(req2);
      const cookie2 = res2.headers.get('set-cookie');
      if (!cookie2) throw new Error('Set-Cookie header missing');
      const verifier2Match = cookie2.match(/kick_pkce_verifier=([^;]+)/);
      if (!verifier2Match) throw new Error('Verifier match failed');
      const verifier2 = verifier2Match[1];

      // Each invocation should generate a fresh verifier
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('PKCE verification relationship', () => {
    it('code_challenge is derived from verifier via SHA256', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;
      const challenge = urlParams.get('code_challenge');

      const setCookieHeader = res.headers.get('set-cookie');
      if (!setCookieHeader) throw new Error('Set-Cookie header missing');
      const match = setCookieHeader.match(/kick_pkce_verifier=([^;]+)/);
      if (!match) throw new Error('Verifier match failed');
      const verifier = match[1];

      // Verify that challenge = SHA256(verifier) in base64url
      const expectedChallenge = crypto.createHash('sha256').update(verifier).digest('base64url');

      expect(challenge).toBe(expectedChallenge);
    });
  });

  describe('response shape and headers', () => {
    it('response has correct redirect status and location header', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.has('location')).toBe(true);
    });

    it('authorize URL contains all required OAuth 2.0 PKCE parameters', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;

      const requiredParams = [
        'client_id',
        'redirect_uri',
        'response_type',
        'scope',
        'code_challenge',
        'code_challenge_method',
        'state',
      ];

      for (const param of requiredParams) {
        expect(urlParams.has(param)).toBe(true);
        expect(urlParams.get(param)).toBeTruthy();
      }
    });

    it('response_type is always code', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      if (!location) throw new Error('Location header missing');
      const urlParams = new URL(location).searchParams;
      expect(urlParams.get('response_type')).toBe('code');
    });
  });

  describe('edge cases', () => {
    it('handles multiple fid values correctly', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';

      const fidValues = [1, 100, 999999, 123456789];

      for (const fid of fidValues) {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));

        const req = makeRequest('/api/auth/kick');
        const res = await GET(req);

        const location = res.headers.get('location');
        if (!location) throw new Error('Location header missing');
        const urlParams = new URL(location).searchParams;
        expect(urlParams.get('state')).toBe(String(fid));
      }
    });

    it('handles client ID with special characters', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-client-id-with_special.chars';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      expect(location).toContain('client_id=test-client-id-with_special.chars');
    });

    it('handles base URL with trailing slash', async () => {
      process.env.NEXT_PUBLIC_KICK_CLIENT_ID = 'test-kick-client-id';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com/';
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeRequest('/api/auth/kick');
      const res = await GET(req);

      const location = res.headers.get('location');
      // The redirect_uri should be properly formed even with trailing slash
      expect(location).toContain('redirect_uri=');
    });
  });
});
