import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makeRequest,
  makePostRequest,
  mockUnauthenticatedSession,
  mockAuthenticatedSession,
  mockAdminSession,
} from '@/test-utils/api-helpers';

const mockEnv = vi.hoisted(() => ({
  JUKE_API_KEY: 'jk_sec_live_test' as string | undefined,
  JUKE_USER_TOKEN: 'jwt_test' as string | undefined,
  JUKE_CREATE_PASSWORD: 'ZAO' as string | undefined,
}));

const { mockGetSessionData, mockCreateJukeSpace } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockCreateJukeSpace: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

vi.mock('@/lib/spaces/juke-api', () => ({
  createJukeSpace: mockCreateJukeSpace,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/** A successful Juke create result the mocked client returns. */
const CREATED = {
  ok: true,
  space: {
    id: 'zao-live-1',
    embedUrl: 'https://juke.audio/embed/zao-live-1',
    raw: { id: 'zao-live-1' },
  },
};

describe('POST /api/juke/space', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.JUKE_API_KEY = 'jk_sec_live_test';
    mockEnv.JUKE_USER_TOKEN = 'jwt_test';
    mockEnv.JUKE_CREATE_PASSWORD = 'ZAO';
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authorisation', () => {
    it('returns 401 with no session and no password', async () => {
      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockCreateJukeSpace).not.toHaveBeenCalled();
    });

    it('returns 401 for an authenticated non-admin with no password', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));

      expect(res.status).toBe(401);
      expect(mockCreateJukeSpace).not.toHaveBeenCalled();
    });

    it('returns 401 when the password is wrong', async () => {
      const res = await POST(
        makePostRequest('/api/juke/space', { title: 'ZAO Live', password: 'nope' }),
      );

      expect(res.status).toBe(401);
      expect(mockCreateJukeSpace).not.toHaveBeenCalled();
    });

    it('returns 401 when a password is sent but JUKE_CREATE_PASSWORD is unset', async () => {
      mockEnv.JUKE_CREATE_PASSWORD = undefined;

      const res = await POST(
        makePostRequest('/api/juke/space', { title: 'ZAO Live', password: 'ZAO' }),
      );

      expect(res.status).toBe(401);
      expect(mockCreateJukeSpace).not.toHaveBeenCalled();
    });

    it('accepts the correct password without a session', async () => {
      mockCreateJukeSpace.mockResolvedValue(CREATED);

      const res = await POST(
        makePostRequest('/api/juke/space', { title: 'Fractal Call', password: 'ZAO' }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      // The password must not be forwarded to the Juke client.
      expect(mockCreateJukeSpace).toHaveBeenCalledWith(
        { title: 'Fractal Call' },
        { apiKey: 'jk_sec_live_test', userToken: 'jwt_test' },
      );
    });

    it('accepts an admin session without a password', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockCreateJukeSpace.mockResolvedValue(CREATED);

      const res = await POST(
        makePostRequest('/api/juke/space', { title: 'ZAOstock Standup', announceCast: true }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.id).toBe('zao-live-1');
      expect(mockCreateJukeSpace).toHaveBeenCalledWith(
        { title: 'ZAOstock Standup', announceCast: true },
        { apiKey: 'jk_sec_live_test', userToken: 'jwt_test' },
      );
    });
  });

  describe('configuration', () => {
    it('returns 503 naming JUKE_API_KEY when only the key is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockEnv.JUKE_API_KEY = undefined;

      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toContain('JUKE_API_KEY');
      expect(body.error).not.toContain('JUKE_USER_TOKEN');
    });

    it('returns 503 naming JUKE_USER_TOKEN when only the token is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockEnv.JUKE_USER_TOKEN = undefined;

      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toContain('JUKE_USER_TOKEN');
    });

    it('returns 503 naming both when neither credential is set', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockEnv.JUKE_API_KEY = undefined;
      mockEnv.JUKE_USER_TOKEN = undefined;

      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toContain('JUKE_API_KEY');
      expect(body.error).toContain('JUKE_USER_TOKEN');
    });
  });

  describe('request validation', () => {
    it('returns 400 when the body is not valid JSON', async () => {
      const res = await POST(
        makeRequest('/api/juke/space', { method: 'POST', body: '{not json' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/valid JSON/i);
    });

    it('returns 400 when the title is missing', async () => {
      const res = await POST(makePostRequest('/api/juke/space', { title: '', password: 'ZAO' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when scheduledAt is not an ISO datetime', async () => {
      const res = await POST(
        makePostRequest('/api/juke/space', {
          title: 'ZAO Live',
          password: 'ZAO',
          scheduledAt: 'next tuesday',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });
  });

  describe('upstream failures', () => {
    it('returns 502 when the Juke API rejects the request', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockCreateJukeSpace.mockResolvedValue({
        ok: false,
        status: 401,
        error: 'Juke API returned 401',
      });

      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Juke API returned 401');
    });

    it('returns 500 when createJukeSpace throws unexpectedly', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockCreateJukeSpace.mockRejectedValue(new Error('boom'));

      const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create Juke space');
    });
  });
});
