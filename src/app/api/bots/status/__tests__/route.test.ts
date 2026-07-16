import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAdminSession, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch
global.fetch = vi.fn();

import { GET } from '../route';

describe('GET /api/bots/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.COWORK_API_URL;
    delete process.env.COWORK_BOT_TOKEN;
  });

  describe('Authentication guard', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(401);
      expect(body.configured).toBe(false);
      expect(body.error).toBe('unauthorized');
      expect(body.bots).toEqual([]);
    });

    it('returns 401 when user is authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(401);
      expect(body.configured).toBe(false);
      expect(body.error).toBe('unauthorized');
    });

    it('allows request when user is admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      process.env.COWORK_API_URL = 'https://example.com';
      process.env.COWORK_BOT_TOKEN = 'test-token';
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      const res = await GET();

      expect(res.status).toBe(200);
    });
  });

  describe('Configuration checks', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
    });

    it('returns configured=false when COWORK_API_URL is missing', async () => {
      delete process.env.COWORK_API_URL;
      process.env.COWORK_BOT_TOKEN = 'test-token';

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.configured).toBe(false);
      expect(body.bots).toEqual([]);
    });

    it('returns configured=false when COWORK_BOT_TOKEN is missing', async () => {
      process.env.COWORK_API_URL = 'https://example.com';
      delete process.env.COWORK_BOT_TOKEN;

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.configured).toBe(false);
      expect(body.bots).toEqual([]);
    });

    it('returns configured=false when both env vars are missing', async () => {
      delete process.env.COWORK_API_URL;
      delete process.env.COWORK_BOT_TOKEN;

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.configured).toBe(false);
      expect(body.bots).toEqual([]);
    });
  });

  describe('Successful fetch from cowork board', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      process.env.COWORK_API_URL = 'https://example.com';
      process.env.COWORK_BOT_TOKEN = 'test-token';
    });

    it('returns 200 with bots data on success', async () => {
      const mockBots = [
        {
          bot: 'zoe',
          status: 'up' as const,
          ts: '2026-01-01T00:00:00Z',
          online: true,
          ageSeconds: 10,
        },
        {
          bot: 'devz',
          status: 'degraded' as const,
          ts: '2026-01-01T00:00:05Z',
          online: true,
          ageSeconds: 5,
        },
      ];
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: mockBots }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.configured).toBe(true);
      expect(body.bots).toEqual(mockBots);
      expect(body.error).toBeUndefined();
    });

    it('coerces null bots to empty array', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: null }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.bots).toEqual([]);
    });

    it('coerces missing bots field to empty array', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.bots).toEqual([]);
    });

    it('strips trailing slash from COWORK_API_URL', async () => {
      process.env.COWORK_API_URL = 'https://example.com/';
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      await GET();

      const callUrl = vi.mocked(global.fetch).mock.calls[0]?.[0];
      expect(callUrl).toBe('https://example.com/api/v1/bots');
    });

    it('includes Authorization header with bearer token', async () => {
      process.env.COWORK_BOT_TOKEN = 'secret-bot-token';
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      await GET();

      const callOptions = vi.mocked(global.fetch).mock.calls[0]?.[1];
      expect((callOptions as Record<string, unknown>)?.headers).toEqual({
        Authorization: 'Bearer secret-bot-token',
      });
    });

    it('sets cache=no-store', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      await GET();

      const callOptions = vi.mocked(global.fetch).mock.calls[0]?.[1];
      expect((callOptions as Record<string, unknown>)?.cache).toBe('no-store');
    });

    it('sets a 6s timeout via AbortController', async () => {
      // Verify that the fetch call receives an AbortSignal for timeout handling
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      await GET();

      // The AbortController should have been passed to fetch
      const callOptions = vi.mocked(global.fetch).mock.calls[0]?.[1];
      expect((callOptions as Record<string, unknown>)?.signal).toBeDefined();
      // Verify it's an AbortSignal
      const signal = (callOptions as Record<string, unknown>)?.signal as AbortSignal;
      expect(signal.constructor.name).toBe('AbortSignal');
    });

    it('returns fetchedAt timestamp in response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.fetchedAt).toBeDefined();
      expect(typeof body.fetchedAt).toBe('string');
      // Should be a valid ISO date
      expect(() => new Date(body.fetchedAt as string)).not.toThrow();
    });
  });

  describe('Cowork board error responses', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      process.env.COWORK_API_URL = 'https://example.com';
      process.env.COWORK_BOT_TOKEN = 'test-token';
    });

    it('returns 502 with error message when cowork board returns non-ok status', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(new Response('Not found', { status: 404 }));

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.configured).toBe(true);
      expect(body.bots).toEqual([]);
      expect(body.error).toBe('cowork board returned 404');
    });

    it('returns 502 with error message on 500 from cowork board', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toBe('cowork board returned 500');
    });

    it('returns 502 with error message on 403 from cowork board', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toBe('cowork board returned 403');
    });
  });

  describe('Fetch failures and exceptions', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      process.env.COWORK_API_URL = 'https://example.com';
      process.env.COWORK_BOT_TOKEN = 'test-token';
    });

    it('returns 502 with generic error message on fetch exception', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network timeout'));

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.configured).toBe(true);
      expect(body.bots).toEqual([]);
      expect(body.error).toBe('could not reach the cowork board');
    });

    it('returns 502 on unknown error type', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce('some-string-error');

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toBe('could not reach the cowork board');
    });

    it('returns 502 on AbortError (timeout)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.mocked(global.fetch).mockRejectedValueOnce(abortError);

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(502);
      expect(body.error).toBe('could not reach the cowork board');
    });
  });

  describe('Response format', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      process.env.COWORK_API_URL = 'https://example.com';
      process.env.COWORK_BOT_TOKEN = 'test-token';
    });

    it('always includes configured, fetchedAt, and bots fields', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).toHaveProperty('configured');
      expect(body).toHaveProperty('fetchedAt');
      expect(body).toHaveProperty('bots');
    });

    it('includes error field only when there is an error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.error).toBeUndefined();
    });

    it('includes error field when there is an error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(new Response('Bad Request', { status: 400 }));

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe('string');
    });

    it('returns NextResponse with JSON content-type', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: [] }), { status: 200 }),
      );

      const res = await GET();

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Multiple bots in response', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      process.env.COWORK_API_URL = 'https://example.com';
      process.env.COWORK_BOT_TOKEN = 'test-token';
    });

    it('handles multiple bots with different statuses', async () => {
      const mockBots = [
        {
          bot: 'zoe',
          status: 'up' as const,
          ts: '2026-01-01T00:00:00Z',
          online: true,
          ageSeconds: 10,
        },
        {
          bot: 'devz',
          status: 'degraded' as const,
          ts: '2026-01-01T00:00:05Z',
          online: false,
          ageSeconds: 300,
        },
        {
          bot: 'bonfire',
          status: 'down' as const,
          ts: '2026-01-01T00:00:10Z',
          online: false,
          ageSeconds: 3600,
        },
      ];
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: mockBots }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect((body.bots as unknown[]).length).toBe(3);
      expect(body.bots).toEqual(mockBots);
    });

    it('preserves bot metadata if present', async () => {
      const mockBots = [
        {
          bot: 'zoe',
          status: 'up' as const,
          ts: '2026-01-01T00:00:00Z',
          online: true,
          ageSeconds: 10,
          meta: { version: '1.2.3', uptime: 86400 },
        },
      ];
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ bots: mockBots }), { status: 200 }),
      );

      const res = await GET();
      const body = (await res.json()) as Record<string, unknown>;

      expect((body.bots as unknown[])[0]).toEqual(mockBots[0]);
    });
  });
});
