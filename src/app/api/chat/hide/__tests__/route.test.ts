import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockGetClientIp, mockLogAuditEvent } = vi.hoisted(() => ({
  mockGetClientIp: vi.fn(),
  mockLogAuditEvent: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: mockGetClientIp,
  logAuditEvent: mockLogAuditEvent,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/chat/hide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
    mockFrom.mockReturnValue(chainMock({ error: null }).chain);
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when castHash is missing', async () => {
      const res = await POST(makePostRequest('/api/chat/hide', { reason: 'spam' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when castHash is invalid format', async () => {
      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: 'not-a-valid-hash',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when castHash is too short', async () => {
      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when reason exceeds max length (500 chars)', async () => {
      const longReason = 'a'.repeat(501);
      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: longReason,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid 40-char hash (0x + 40 hex)', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0xabcdef1234567890abcdef1234567890abcdef12',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('hidden_messages');
    });

    it('accepts valid 64-char hash (0x + 64 hex)', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts request without optional reason', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts reason with exactly 500 chars', async () => {
      const maxReason = 'a'.repeat(500);
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: maxReason,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('Supabase interaction', () => {
    it('calls supabaseAdmin.from with hidden_messages table', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('hidden_messages');
    });

    it('performs upsert with correct payload structure', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      expect(upsertCall).toHaveBeenCalled();
      const [payload, options] = upsertCall.mock.calls[0] as unknown as Array<unknown>;

      expect(payload).toEqual({
        cast_hash: '0x1234567890abcdef1234567890abcdef12345678',
        hidden_by_fid: 123,
        reason: 'spam',
      });
      expect(options).toEqual({ onConflict: 'cast_hash' });
    });

    it('upserts with null reason when reason is not provided', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as Array<unknown>;

      expect(payload).toEqual({
        cast_hash: '0x1234567890abcdef1234567890abcdef12345678',
        hidden_by_fid: 123,
        reason: null,
      });
    });

    it('uses admin session fid in hidden_by_fid field', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      const upsertCall = vi.mocked(chain.upsert);
      const [payload] = upsertCall.mock.calls[0] as unknown as [{ hidden_by_fid: number }];

      expect(payload.hidden_by_fid).toBe(999);
    });
  });

  describe('audit logging', () => {
    it('logs audit event after successful upsert', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'message.hide',
          targetType: 'cast',
          targetId: '0x1234567890abcdef1234567890abcdef12345678',
          details: { reason: 'spam' },
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('logs audit event with null reason when reason not provided', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'message.hide',
          targetType: 'cast',
          targetId: '0x1234567890abcdef1234567890abcdef12345678',
          details: { reason: null },
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('calls getClientIp with the request object', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/chat/hide', {
        castHash: '0x1234567890abcdef1234567890abcdef12345678',
        reason: 'spam',
      });

      await POST(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('includes correct client IP in audit event', async () => {
      mockGetClientIp.mockReturnValue('203.0.113.42');
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '203.0.113.42',
        }),
      );
    });

    it('logs audit event with undefined ipAddress when getClientIp returns undefined', async () => {
      mockGetClientIp.mockReturnValue(undefined);
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
        }),
      );
    });
  });

  describe('success response', () => {
    it('returns 200 with success true on valid request', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Object.keys(body)).toEqual(['success']);
    });

    it('does not expose internal details in success response', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(body.data).toBeUndefined();
      expect(body.details).toBeUndefined();
      expect(body.fid).toBeUndefined();
      expect(body.castHash).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('returns 500 when Supabase upsert returns an error', async () => {
      const dbError = new Error('Unique constraint violation');
      mockFrom.mockReturnValue(chainMock({ error: dbError }).chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to hide message');
    });

    it('returns 500 when request body is not valid JSON', async () => {
      // Manually override the body to trigger JSON parsing error
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/chat/hide', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to hide message');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = new Error('Database connection failed');
      mockFrom.mockReturnValue(chainMock({ error: dbError }).chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Hide message error:',
        expect.any(Error),
      );
    });

    it('does not log audit event when Supabase upsert fails', async () => {
      const dbError = new Error('Database error');
      mockFrom.mockReturnValue(chainMock({ error: dbError }).chain);

      await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Password: hunter2, connection to db.example.com failed');
      mockFrom.mockReturnValue(chainMock({ error: dbError }).chain);

      const res = await POST(
        makePostRequest('/api/chat/hide', {
          castHash: '0x1234567890abcdef1234567890abcdef12345678',
          reason: 'spam',
        }),
      );
      const body = await res.json();

      expect(body.error).toBe('Failed to hide message');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });
});
