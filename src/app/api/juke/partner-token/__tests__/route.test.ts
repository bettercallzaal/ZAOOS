import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

const mockEnv = vi.hoisted(() => ({
  JUKE_API_KEY: 'jk_sec_live_test' as string | undefined,
}));

const { mockGetSessionData, mockMintPartnerToken } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockMintPartnerToken: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

vi.mock('@/lib/spaces/juke-partner-token', () => ({
  mintPartnerToken: mockMintPartnerToken,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/juke/partner-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.JUKE_API_KEY = 'jk_sec_live_test';
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Sign in to mint a partner token');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(mockMintPartnerToken).not.toHaveBeenCalled();
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue({ username: 'testuser' });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Sign in to mint a partner token');
      expect(mockMintPartnerToken).not.toHaveBeenCalled();
    });

    it('succeeds for an authenticated user with a valid fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 12345 }));
      mockMintPartnerToken.mockResolvedValue({
        ok: true,
        data: {
          token: 'jwt_test_token_abc123',
          fid: 12345,
          expires_at: '2026-07-16T01:30:00Z',
          partner_app_id: 'zao',
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.token).toBe('jwt_test_token_abc123');
      expect(body.fid).toBe(12345);
      expect(body.expires_at).toBe('2026-07-16T01:30:00Z');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(res.headers.get('x-zao-juke-partner-token')).toBe('v1');
      expect(mockMintPartnerToken).toHaveBeenCalledWith('jk_sec_live_test', {
        fid: 12345,
        ttlSeconds: 300,
      });
    });
  });

  describe('configuration', () => {
    it('returns 503 when JUKE_API_KEY is not configured', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockEnv.JUKE_API_KEY = undefined;

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('JUKE_API_KEY');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(mockMintPartnerToken).not.toHaveBeenCalled();
    });
  });

  describe('upstream failures', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 12345 }));
    });

    it('returns 502 when mintPartnerToken returns a 5xx error', async () => {
      mockMintPartnerToken.mockResolvedValue({
        ok: false,
        status: 502,
        error: 'Juke API returned 502',
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Juke API returned 502');
      expect(res.headers.get('cache-control')).toBe('no-store');
    });

    it('returns 400 when mintPartnerToken returns a 4xx error', async () => {
      mockMintPartnerToken.mockResolvedValue({
        ok: false,
        status: 400,
        error: 'fid must be a positive integer',
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('fid must be a positive integer');
      expect(res.headers.get('cache-control')).toBe('no-store');
    });

    it('returns 429 when rate limited by Juke', async () => {
      mockMintPartnerToken.mockResolvedValue({
        ok: false,
        status: 429,
        error: 'Juke returned 429: Rate limit exceeded',
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(429);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Rate limit exceeded');
    });

    it('throws when mintPartnerToken throws an uncaught error', async () => {
      mockMintPartnerToken.mockRejectedValue(new Error('Network timeout'));

      // The route does not catch exceptions from mintPartnerToken, so it propagates
      // and Next.js will return a 500 error page. We verify the mock was called.
      try {
        await GET();
        // If we get here, the test should fail because an error should have been thrown
        expect(true).toBe(false);
      } catch (err: unknown) {
        expect(err instanceof Error).toBe(true);
        if (err instanceof Error) {
          expect(err.message).toBe('Network timeout');
        }
        expect(mockMintPartnerToken).toHaveBeenCalled();
      }
    });

    it('logs warnings when mintPartnerToken fails', async () => {
      const { logger } = await import('@/lib/logger');
      mockMintPartnerToken.mockResolvedValue({
        ok: false,
        status: 500,
        error: 'Internal server error',
      });

      await GET();

      expect(logger.warn).toHaveBeenCalledWith(
        '[juke/partner-token] mint failed',
        500,
        'Internal server error',
      );
    });
  });

  describe('success cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 98765 }));
    });

    it('passes ttlSeconds=300 to mintPartnerToken', async () => {
      mockMintPartnerToken.mockResolvedValue({
        ok: true,
        data: {
          token: 'jwt_token',
          fid: 98765,
          expires_at: '2026-07-16T01:35:00Z',
          partner_app_id: 'zao',
        },
      });

      await GET();

      expect(mockMintPartnerToken).toHaveBeenCalledWith('jk_sec_live_test', {
        fid: 98765,
        ttlSeconds: 300,
      });
    });

    it('includes partner_app_id in the response even though it is not returned to the client', async () => {
      mockMintPartnerToken.mockResolvedValue({
        ok: true,
        data: {
          token: 'jwt_token',
          fid: 98765,
          expires_at: '2026-07-16T01:35:00Z',
          partner_app_id: 'zao',
        },
      });

      const res = await GET();
      const body = await res.json();

      // Note: partner_app_id is in the upstream response but not returned to the client
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('fid');
      expect(body).toHaveProperty('expires_at');
      expect(body).not.toHaveProperty('partner_app_id');
    });
  });

  describe('response headers', () => {
    it('always sets cache-control: no-store for security', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET();

      expect(res.headers.get('cache-control')).toBe('no-store');
    });

    it('sets x-zao-juke-partner-token header on success', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockMintPartnerToken.mockResolvedValue({
        ok: true,
        data: {
          token: 'jwt_token',
          fid: 123,
          expires_at: '2026-07-16T01:35:00Z',
          partner_app_id: 'zao',
        },
      });

      const res = await GET();

      expect(res.headers.get('x-zao-juke-partner-token')).toBe('v1');
    });
  });
});
