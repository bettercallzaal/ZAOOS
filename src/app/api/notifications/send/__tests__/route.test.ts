import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockGetClientIp, mockLogAuditEvent } = vi.hoisted(() => ({
  mockGetClientIp: vi.fn(),
  mockLogAuditEvent: vi.fn(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: mockGetClientIp,
  logAuditEvent: mockLogAuditEvent,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch
global.fetch = vi.fn() as unknown as typeof fetch;

import { POST } from '../route';

describe('POST /api/notifications/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
    mockLogAuditEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 403 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when session exists but fid is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: undefined }));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('input validation', () => {
    it('returns 400 when recipientFids is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when recipientFids is empty array', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when recipientFids exceeds 500', async () => {
      const fids = Array.from({ length: 501 }, (_, i) => i + 1);
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: fids,
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when recipientFids contains non-integer', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2.5, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when recipientFids contains non-positive number', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 0, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when title is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when title is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: '',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when title exceeds 100 chars', async () => {
      const longTitle = 'a'.repeat(101);
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: longTitle,
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('accepts title with exactly 100 chars', async () => {
      const maxTitle = 'a'.repeat(100);
      const tokensChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tokensChain.handler());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: maxTitle,
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.sent).toBe(0);
      expect(body.skipped).toBe(3);
    });

    it('returns 400 when body is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when body is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: '',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when body exceeds 500 chars', async () => {
      const longBody = 'a'.repeat(501);
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: longBody,
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('accepts body with exactly 500 chars', async () => {
      const maxBody = 'a'.repeat(500);
      const tokensChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tokensChain.handler());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: maxBody,
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.sent).toBe(0);
    });

    it('returns 400 when targetUrl is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('returns 400 when targetUrl is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'not-a-url',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('accepts valid URL with http', async () => {
      const tokensChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tokensChain.handler());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'http://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.sent).toBe(0);
    });

    it('accepts valid URL with https', async () => {
      const tokensChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tokensChain.handler());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com/path?param=value',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.sent).toBe(0);
    });
  });

  describe('token fetching', () => {
    it('returns 500 when token fetch from DB fails', async () => {
      const tokensChain = chainMock({
        data: null,
        error: new Error('Connection refused'),
      });
      mockFrom.mockReturnValue(tokensChain.handler());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to fetch tokens' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns sent:0 when no tokens are found for requested FIDs', async () => {
      const tokensChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(tokensChain.handler());

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.sent).toBe(0);
      expect(body.skipped).toBe(3);
    });

    it('queries supabase for notification_tokens in requested FIDs', async () => {
      const tokensChain = chainMock({ data: [], error: null });
      const selectFn = vi.fn().mockReturnValue(tokensChain.chain);
      const inFn = vi.fn().mockReturnValue(tokensChain.chain);
      const eqFn = vi.fn().mockReturnValue(tokensChain.chain);

      tokensChain.chain.select = selectFn;
      tokensChain.chain.in = inFn;
      tokensChain.chain.eq = eqFn;
      mockFrom.mockReturnValue(tokensChain.chain);

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [10, 20, 30],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('notification_tokens');
      expect(selectFn).toHaveBeenCalledWith('fid, token, url');
      expect(inFn).toHaveBeenCalledWith('fid', [10, 20, 30]);
      expect(eqFn).toHaveBeenCalledWith('enabled', true);
    });
  });

  describe('rate limiting', () => {
    it('skips tokens that sent a notification within last 30 seconds', async () => {
      const now = new Date();
      const recentTime = new Date(now.getTime() - 10_000).toISOString();

      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.com' },
        { fid: 2, token: 'token2', url: 'https://notify.com' },
      ];

      const recentSends = [{ fid: 1, sent_at: recentTime }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: recentSends, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token2'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
      expect(body.skipped).toBe(1);
    });

    it('skips tokens with 100 or more sends in the last 24 hours', async () => {
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.com' },
        { fid: 2, token: 'token2', url: 'https://notify.com' },
      ];

      const now = new Date();
      const recentSends: Array<{ fid: number; sent_at: string }> = [];

      for (let i = 0; i < 100; i += 1) {
        recentSends.push({
          fid: 1,
          sent_at: new Date(now.getTime() - i * 1000).toISOString(),
        });
      }

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: recentSends, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token2'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
      expect(body.skipped).toBe(1);
    });

    it('allows sends when previous send was more than 30 seconds ago', async () => {
      const now = new Date();
      const thirtyOneSecondsAgo = new Date(now.getTime() - 31_000).toISOString();

      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.com' },
        { fid: 2, token: 'token2', url: 'https://notify.com' },
      ];

      const recentSends = [
        { fid: 1, sent_at: thirtyOneSecondsAgo },
        { fid: 2, sent_at: thirtyOneSecondsAgo },
      ];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: recentSends, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            result: { successfulTokens: ['token1', 'token2'] },
          }),
          { status: 200 },
        ),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(2);
      expect(body.skipped).toBe(0);
    });

    it('allows sends when under 100 notifications per day', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const now = new Date();
      const thirtyOneSecondsAgo = new Date(now.getTime() - 31_000);
      const recentSends = Array.from({ length: 50 }, (_, i) => ({
        fid: 1,
        sent_at: new Date(thirtyOneSecondsAgo.getTime() - i * 10_000).toISOString(),
      }));

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: recentSends, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
    });
  });

  describe('sending notifications', () => {
    it('sends notifications to eligible tokens', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.example.com/send' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test Title',
          body: 'Test Body',
          targetUrl: 'https://example.com/notification',
        }),
      );

      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        'https://notify.example.com/send',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('includes all eligible tokens in a single POST body grouped by URL', async () => {
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.example.com/send' },
        { fid: 2, token: 'token2', url: 'https://notify.example.com/send' },
      ];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1', 'token2'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test Title',
          body: 'Test Body',
          targetUrl: 'https://example.com/notification',
        }),
      );

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse((callArgs?.[1]?.body as string) ?? '{}') as unknown as Record<
        string,
        unknown
      >;

      expect(body.title).toBe('Test Title');
      expect(body.body).toBe('Test Body');
      expect(body.targetUrl).toBe('https://example.com/notification');
      expect(body.tokens).toEqual(['token1', 'token2']);
      expect(body.notificationId).toBeDefined();
    });

    it('sends to different URLs separately', async () => {
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify1.example.com/send' },
        { fid: 2, token: 'token2', url: 'https://notify2.example.com/send' },
      ];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1', 'token2'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test Title',
          body: 'Test Body',
          targetUrl: 'https://example.com/notification',
        }),
      );

      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(global.fetch).mock.calls[0]?.[0]).toBe('https://notify1.example.com/send');
      expect(vi.mocked(global.fetch).mock.calls[1]?.[0]).toBe('https://notify2.example.com/send');
    });

    it('counts successful sends when response is ok', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
    });

    it('records invalid tokens in response and disables them', async () => {
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.com' },
        { fid: 2, token: 'token2', url: 'https://notify.com' },
      ];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });
      const updateChain = chainMock({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (
          table === 'notification_tokens' &&
          mockFrom.mock.lastCall?.[0] === 'notification_tokens'
        )
          return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        if (table === 'notification_tokens') return updateChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            result: {
              successfulTokens: ['token1'],
              invalidTokens: ['token2'],
            },
          }),
          { status: 200 },
        ),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
      expect(
        (body.errors as Array<{ fid: number; error: string }> | undefined)?.[0]?.error,
      ).toContain('Invalid token');
    });

    it('handles fetch error gracefully', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network timeout'));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(0);
      expect(
        (body.errors as Array<{ fid: number; error: string }> | undefined)?.[0]?.error,
      ).toContain('Network timeout');
    });

    it('handles HTTP error response from endpoint', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response('Endpoint unavailable', { status: 503 }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(0);
      expect(
        (body.errors as Array<{ fid: number; error: string }> | undefined)?.[0]?.error,
      ).toContain('HTTP 503');
    });

    it('uses Promise.allSettled to handle partial failures', async () => {
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify1.com' },
        { fid: 2, token: 'token2', url: 'https://notify2.com' },
      ];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
            status: 200,
          }),
        )
        .mockRejectedValueOnce(new Error('Network error'));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
      expect((body.errors as Array<{ fid: number; error: string }> | undefined)?.length).toBe(1);
    });
  });

  describe('notification logging', () => {
    it('logs successful sends to notification_log table', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });
      const logInsertChain = chainMock({ error: null });

      const insertFn = vi.fn().mockReturnValue(logInsertChain.chain);
      logInsertChain.chain.insert = insertFn;

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount += 1;
        if (table === 'notification_tokens' && callCount === 1) return tokensChain.handler();
        if (table === 'notification_log' && callCount === 2) return recentChain.handler();
        if (table === 'notification_log' && callCount === 3) return logInsertChain.chain;
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test Title',
          body: 'Test Body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(insertFn).toHaveBeenCalled();
      const insertCall = vi.mocked(insertFn).mock.calls[0]?.[0] as
        | Array<{ fid: number; title: string; body: string; target_url: string; sent_at: string }>
        | undefined;

      expect(insertCall?.[0]?.fid).toBe(1);
      expect(insertCall?.[0]?.title).toBe('Test Title');
      expect(insertCall?.[0]?.body).toBe('Test Body');
      expect(insertCall?.[0]?.target_url).toBe('https://example.com');
      expect(insertCall?.[0]?.sent_at).toBeDefined();
    });

    it('does not log failed sends to notification_log', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });
      const logInsertChain = chainMock({ error: null });

      const insertFn = vi.fn().mockReturnValue(logInsertChain.chain);
      logInsertChain.chain.insert = insertFn;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log' && mockFrom.mock.lastCall?.[0] === 'notification_log')
          return recentChain.handler();
        if (table === 'notification_log') return logInsertChain.chain;
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(new Response('Error', { status: 500 }));

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      const insertCalls = vi.mocked(insertFn).mock.calls;
      const logCall = insertCalls.find((call) => {
        const entry = call[0] as Array<{ fid: number }> | undefined;
        return entry && entry[0]?.fid === 1;
      });

      expect(logCall).toBeUndefined();
    });
  });

  describe('audit logging', () => {
    it('logs audit event with correct action and details', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Notification Title',
          body: 'Notification body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'notification.broadcast',
          targetType: 'notification',
          details: expect.objectContaining({
            title: 'Notification Title',
            recipientCount: 3,
            sent: 1,
          }),
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('includes client IP in audit event', async () => {
      mockGetClientIp.mockReturnValue('203.0.113.42');

      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '203.0.113.42',
        }),
      );
    });

    it('includes actor FID from session', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));

      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('response shape', () => {
    it('returns sent, skipped, and optional errors fields', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).toHaveProperty('sent');
      expect(body).toHaveProperty('skipped');
      expect(Object.keys(body).sort()).toEqual(['sent', 'skipped']);
    });

    it('includes errors array when there are failed sends', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(new Response('Error', { status: 500 }));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.errors).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
    });

    it('omits errors array when all sends succeeded', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token1'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.errors).toBeUndefined();
    });

    it('returns 200 even when all sends fail', async () => {
      const tokens = [{ fid: 1, token: 'token1', url: 'https://notify.com' }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('error handling', () => {
    it('returns 500 when unexpected error occurs', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session error'));

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Internal server error' });
    });

    it('handles malformed JSON request body', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/notifications/send', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Internal server error' });
    });

    it('does not call audit logging when auth fails', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not call audit logging when validation fails', async () => {
      await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('skipped count calculation', () => {
    it('counts users with no tokens as skipped', async () => {
      const tokensChain = chainMock({ data: [], error: null });
      const recentChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.skipped).toBe(3);
    });

    it('counts rate-limited users as skipped', async () => {
      const now = new Date();
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.com' },
        { fid: 2, token: 'token2', url: 'https://notify.com' },
        { fid: 3, token: 'token3', url: 'https://notify.com' },
      ];

      const recentTime = new Date(now.getTime() - 10_000).toISOString();
      const recentSends = [
        { fid: 1, sent_at: recentTime },
        { fid: 2, sent_at: recentTime },
      ];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: recentSends, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token3'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
      expect(body.skipped).toBe(2);
    });

    it('skipped count includes both missing tokens and rate-limited', async () => {
      const now = new Date();
      const tokens = [
        { fid: 1, token: 'token1', url: 'https://notify.com' },
        { fid: 2, token: 'token2', url: 'https://notify.com' },
      ];

      const recentTime = new Date(now.getTime() - 10_000).toISOString();
      const recentSends = [{ fid: 1, sent_at: recentTime }];

      const tokensChain = chainMock({ data: tokens, error: null });
      const recentChain = chainMock({ data: recentSends, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'notification_tokens') return tokensChain.handler();
        if (table === 'notification_log') return recentChain.handler();
        return tokensChain.handler();
      });

      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ result: { successfulTokens: ['token2'] } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/notifications/send', {
          recipientFids: [1, 2, 3, 4],
          title: 'Test',
          body: 'Test body',
          targetUrl: 'https://example.com',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.sent).toBe(1);
      expect(body.skipped).toBe(3);
    });
  });
});
