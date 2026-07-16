import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
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

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: mockGetClientIp,
  logAuditEvent: mockLogAuditEvent,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch
global.fetch = vi.fn() as unknown as typeof fetch;

import { POST } from '../route';

describe('POST /api/admin/broadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
    mockLogAuditEvent.mockResolvedValue(undefined);
    // Set required env var
    process.env.NEYNAR_SIGNER_UUID = 'test-signer-uuid';
    process.env.NEYNAR_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.NEYNAR_SIGNER_UUID;
    delete process.env.NEYNAR_API_KEY;
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(403);
      expect(body).toEqual({ error: 'Admin access required' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when text is missing', async () => {
      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when text is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: '',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when text exceeds 1024 chars', async () => {
      const longText = 'a'.repeat(1025);
      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: longText,
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('accepts text with exactly 1 char', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'a',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('accepts text with exactly 1024 chars', async () => {
      const maxText = 'a'.repeat(1024);
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: maxText,
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('applies default channel when channel is not provided', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      // Verify that fetch was called with default channel 'zao'
      expect(vi.mocked(global.fetch).mock.calls[0]?.[1]?.body).toContain('"channel_id":"zao"');
    });

    it('accepts custom channel when provided', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'dev',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      // Verify that fetch was called with custom channel
      expect(vi.mocked(global.fetch).mock.calls[0]?.[1]?.body).toContain('"channel_id":"dev"');
    });
  });

  describe('environment configuration', () => {
    it('returns 500 when NEYNAR_SIGNER_UUID is not configured', async () => {
      delete process.env.NEYNAR_SIGNER_UUID;

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Signer not configured' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('Neynar API interaction', () => {
    it('calls Neynar API with correct URL and headers', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        'https://api.neynar.com/v2/farcaster/cast',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            api_key: 'test-api-key',
          }),
        }),
      );
    });

    it('sends correct payload to Neynar API', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'custom-channel',
        }),
      );

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse((callArgs?.[1]?.body ?? '{}') as string) as unknown;

      expect(body).toEqual({
        signer_uuid: 'test-signer-uuid',
        text: 'Hello world',
        channel_id: 'custom-channel',
      });
    });

    it('returns 500 when Neynar API returns non-2xx status', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response('Unauthorized', { status: 401 }));

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to broadcast cast' });
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('logs error to logger when Neynar API fails', async () => {
      const { logger } = await import('@/lib/logger');
      vi.mocked(global.fetch).mockResolvedValue(new Response('API Error', { status: 400 }));

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[broadcast] Neynar error:',
        400,
        'API Error',
      );
    });

    it('extracts cast hash from Neynar response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            cast: { hash: 'xyz789abc' },
          }),
          { status: 200 },
        ),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.hash).toBe('xyz789abc');
    });
  });

  describe('audit logging', () => {
    it('logs audit event after successful broadcast', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'broadcast',
          targetType: 'channel',
          targetId: 'zao',
          details: expect.objectContaining({
            text: 'Hello world',
            castHash: 'abc123',
          }),
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('truncates text to 100 chars in audit log details', async () => {
      const longText = 'a'.repeat(150);
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: longText,
          channel: 'zao',
        }),
      );

      const auditCall = vi.mocked(mockLogAuditEvent).mock.calls[0];
      const details = (auditCall?.[0] as Record<string, unknown>)?.details as Record<
        string,
        unknown
      >;
      const truncatedText = details?.text as string;

      expect(truncatedText).toBe('a'.repeat(100));
    });

    it('includes cast hash from response in audit details', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'xyz789abc' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      const auditCall = vi.mocked(mockLogAuditEvent).mock.calls[0];
      const details = (auditCall?.[0] as Record<string, unknown>)?.details as Record<
        string,
        unknown
      >;

      expect(details?.castHash).toBe('xyz789abc');
    });

    it('includes actor fid from session in audit log', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(vi.mocked(mockLogAuditEvent).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });

    it('calls getClientIp with the request object', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      const req = makePostRequest('/api/admin/broadcast', {
        text: 'Hello world',
        channel: 'zao',
      });

      await POST(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('includes correct client IP in audit event', async () => {
      mockGetClientIp.mockReturnValue('203.0.113.42');
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(vi.mocked(mockLogAuditEvent).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          ipAddress: '203.0.113.42',
        }),
      );
    });

    it('fire-and-forget audit log: does not fail response if audit event rejects', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );
      mockLogAuditEvent.mockRejectedValue(new Error('Audit DB connection failed'));

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      // Response should still succeed even if audit log fails
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.hash).toBe('abc123');
    });

    it('logs critical error when audit event fails after cast succeeds', async () => {
      const { logger } = await import('@/lib/logger');
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );
      mockLogAuditEvent.mockRejectedValue(new Error('Database connection failed'));

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining('[broadcast] CRITICAL audit-trail drop'),
      );
      // Verify the logged string contains the cast hash
      const logCall = vi
        .mocked(logger.error)
        .mock.calls.find((call) =>
          (call[0] as string).includes('[broadcast] CRITICAL audit-trail drop'),
        );
      expect((logCall?.[0] as string) ?? '').toContain('castHash=abc123');
    });

    it('logs cast hash as <none> in critical error when response has no hash', async () => {
      const { logger } = await import('@/lib/logger');
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: {} }), { status: 200 }),
      );
      mockLogAuditEvent.mockRejectedValue(new Error('Database error'));

      await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining('[broadcast] CRITICAL audit-trail drop'),
      );
      // Verify the logged string contains the <none> placeholder
      const logCall = vi
        .mocked(logger.error)
        .mock.calls.find((call) =>
          (call[0] as string).includes('[broadcast] CRITICAL audit-trail drop'),
        );
      expect((logCall?.[0] as string) ?? '').toContain('castHash=<none>');
    });
  });

  describe('success response', () => {
    it('returns 200 with success true on valid request', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123' } }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.hash).toBe('abc123');
    });

    it('returns hash in response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'custom-hash-value' } }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.hash).toBe('custom-hash-value');
    });

    it('does not expose sensitive details in response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: { hash: 'abc123', author: { fid: 999 } } }), {
          status: 200,
        }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(Object.keys(body).sort()).toEqual(['hash', 'success']);
      expect(body.author).toBeUndefined();
      expect(body.cast).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/broadcast', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Internal server error' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('logs error when unexpected exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      // Mock global.fetch to throw an error before we even get there
      // Actually, we need to make the body parsing fail to trigger the catch
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/broadcast', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{bad json',
        },
      );

      await POST(malformedReq);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        '[broadcast] Unexpected error:',
        expect.any(Error),
      );
    });

    it('does not call audit logging when body parsing fails', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/broadcast', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{bad json',
        },
      );

      await POST(malformedReq);

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not call Neynar API when validation fails', async () => {
      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: '',
          channel: 'zao',
        }),
      );

      expect(res.status).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not expose sensitive error details in error response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response('Signer authentication failed at db.internal.example.com:5432', {
          status: 500,
        }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(body.error).toBe('Failed to broadcast cast');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  describe('type safety', () => {
    it('handles response without cast property gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.hash).toBeUndefined();
    });

    it('handles response with cast but without hash property', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ cast: {} }), { status: 200 }),
      );

      const res = await POST(
        makePostRequest('/api/admin/broadcast', {
          text: 'Hello world',
          channel: 'zao',
        }),
      );
      const body = (await res.json()) as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.hash).toBeUndefined();
    });
  });
});
