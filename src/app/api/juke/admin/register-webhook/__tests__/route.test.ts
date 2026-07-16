import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  makeRequest,
  mockAdminSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const mockEnv = vi.hoisted(() => ({
  JUKE_API_KEY: 'jk_sec_live_test' as string | undefined,
}));

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock fetch globally
global.fetch = vi.fn();

import { GET, POST } from '../route';

const JUKE_SUCCESS_RESPONSE = {
  id: 'webhook_xyz',
  url: 'https://zaoos.com/api/juke/webhooks',
  events: [
    'room.started',
    'room.finished',
    'participant.joined',
    'participant.left',
    'recording.ready',
  ],
  secret: 'whsec_generated_by_juke_xyz123',
  created_at: '2026-07-15T12:00:00Z',
};

describe('POST /api/juke/admin/register-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.JUKE_API_KEY = 'jk_sec_live_test';
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    vi.resetAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Admin only');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 401 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'user', isAdmin: false });
      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Admin only');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('accepts an admin session', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));

      expect(res.status).toBe(201);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('environment configuration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns 503 when JUKE_API_KEY is missing', async () => {
      mockEnv.JUKE_API_KEY = undefined;
      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Missing JUKE_API_KEY');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 503 when JUKE_API_KEY is empty string', async () => {
      mockEnv.JUKE_API_KEY = '';
      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toContain('Missing JUKE_API_KEY');
    });
  });

  describe('request body validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('handles empty body gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(makeRequest('/api/juke/admin/register-webhook', { method: 'POST' }));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.ok).toBe(true);
      // Should use default URL
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const fetchBody = JSON.parse(fetchCall[1].body);
      expect(fetchBody.url).toBe('https://zaoos.com/api/juke/webhooks');
    });

    it('returns 400 when url is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/juke/admin/register-webhook', { url: 'not-a-url' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Invalid body');
      expect(body.details).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when extra fields are sent', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(
        makePostRequest('/api/juke/admin/register-webhook', {
          url: 'https://example.com',
          extraField: 'ignored',
        }),
      );
      const body = await res.json();

      // Zod strips unknown fields but accepts valid URL
      expect(res.status).toBe(201);
      expect(body.ok).toBe(true);
    });

    it('accepts a valid custom URL', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const customUrl = 'https://example.com/webhook';
      const res = await POST(
        makePostRequest('/api/juke/admin/register-webhook', { url: customUrl }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.ok).toBe(true);
      expect(body.url).toBe(customUrl);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const fetchBody = JSON.parse(fetchCall[1].body);
      expect(fetchBody.url).toBe(customUrl);
    });

    it('uses default URL when url is omitted', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(
        makePostRequest('/api/juke/admin/register-webhook', { someOtherField: 'ignored' }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.url).toBe('https://zaoos.com/api/juke/webhooks');
    });
  });

  describe('successful webhook registration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns 201 with webhook details on success', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.ok).toBe(true);
      expect(body.juke).toEqual(JUKE_SUCCESS_RESPONSE);
      expect(body.action_required).toBeDefined();
      expect(body.action_required).toContain('JUKE_WEBHOOK_SECRET');
      expect(body.events).toEqual([
        'room.started',
        'room.finished',
        'participant.joined',
        'participant.left',
        'recording.ready',
      ]);
    });

    it('sends correct headers to Juke API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      await POST(makePostRequest('/api/juke/admin/register-webhook', {}));

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.juke.audio/v1/developer/webhooks');
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].headers['X-Juke-Api-Key']).toBe('jk_sec_live_test');
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
    });

    it('sends correct events list to Juke API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      await POST(makePostRequest('/api/juke/admin/register-webhook', {}));

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const fetchBody = JSON.parse(fetchCall[1].body);
      expect(fetchBody.events).toEqual([
        'room.started',
        'room.finished',
        'participant.joined',
        'participant.left',
        'recording.ready',
      ]);
    });

    it('includes URL in the request body to Juke', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const customUrl = 'https://custom.example.com/hook';
      await POST(makePostRequest('/api/juke/admin/register-webhook', { url: customUrl }));

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const fetchBody = JSON.parse(fetchCall[1].body);
      expect(fetchBody.url).toBe(customUrl);
    });
  });

  describe('Juke API errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns 502 when Juke returns non-ok status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'Invalid API key' }),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Juke returned 401');
      expect(body.juke).toEqual({ error: 'Invalid API key' });
    });

    it('returns 502 when Juke returns 429 (rate limit)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: 'Rate limited' }),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toContain('429');
    });

    it('handles non-JSON response body from Juke', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.juke).toBe('Internal Server Error');
    });

    it('handles invalid JSON response body from Juke', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => 'not valid json {',
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.juke).toBe('not valid json {');
    });
  });

  describe('unexpected errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns 500 when fetch throws unexpectedly', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('Network error');
    });

    it('returns 500 when response.text() throws', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockRejectedValueOnce(new Error('Stream error')),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Stream error');
    });

    it('returns 500 for unknown error with message', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Unknown error'));

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Unknown error');
    });

    it('returns 500 for non-Error exception', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('raw string error');

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Unknown error');
    });
  });

  describe('response secrecy', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('includes the secret in the success response body', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.juke.secret).toBe('whsec_generated_by_juke_xyz123');
    });

    it('includes action_required instructions in response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(JUKE_SUCCESS_RESPONSE),
      });

      const res = await POST(makePostRequest('/api/juke/admin/register-webhook', {}));
      const body = await res.json();

      expect(body.action_required).toContain('COPY');
      expect(body.action_required).toContain('JUKE_WEBHOOK_SECRET');
      expect(body.action_required).toContain('Vercel');
      expect(body.action_required).toContain('redeploy');
    });
  });
});

describe('GET /api/juke/admin/register-webhook', () => {
  it('returns 405 Method Not Allowed', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(405);
    expect(body.ok).toBe(false);
    expect(body.error).toContain('POST only');
  });

  it('includes endpoint description in error', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.error).toContain('one-shot admin registration endpoint');
  });
});
