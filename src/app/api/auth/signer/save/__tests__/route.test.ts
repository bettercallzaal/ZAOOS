import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetSignerStatus, mockGetSession, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetSignerStatus: vi.fn(),
  mockGetSession: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
  getSession: mockGetSession,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getSignerStatus: mockGetSignerStatus,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { POST } from '../route';

describe('POST /api/auth/signer/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when session is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'valid-uuid-1234',
          fid: 456,
        }),
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when signerUuid is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          fid: 123,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when signerUuid is an empty string', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: '',
          fid: 123,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when fid is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when fid is not an integer', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 123.5,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when fid is not positive', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 0,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when fid is negative', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: -100,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when request body is empty', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(makePostRequest('/api/auth/signer/save', {}));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid input' });
    });
  });

  describe('FID mismatch validation', () => {
    it('returns 403 when request fid does not match session fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 100 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 200,
        }),
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: 'FID mismatch' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('allows when request fid matches session fid', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(200);
      expect(mockGetSignerStatus).toHaveBeenCalled();
    });
  });

  describe('signer ownership verification', () => {
    it('returns 403 when signer fid does not belong to user', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 100 }));

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: 200,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 100,
        }),
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: 'Signer does not belong to this user' });
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('returns 403 when signer fid is null', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 100 }));

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: null,
        status: 'pending_review',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 100,
        }),
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: 'Signer does not belong to this user' });
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('allows save when signer fid matches session fid', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'matching-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'matching-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(200);
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockSession.signerUuid).toBe('matching-uuid');
      expect(mockSession.save).toHaveBeenCalled();
    });
  });

  describe('getSignerStatus call', () => {
    it('calls getSignerStatus with the provided signerUuid', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'my-custom-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'my-custom-uuid',
          fid: 123,
        }),
      );

      expect(mockGetSignerStatus).toHaveBeenCalledWith('my-custom-uuid');
      expect(mockGetSignerStatus).toHaveBeenCalledTimes(1);
    });

    it('passes signerUuid to getSignerStatus even when containing special characters', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const specialUuid = '550e8400-e29b-41d4-a716-446655440000';
      const signerStatusResponse = {
        signer_uuid: specialUuid,
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: specialUuid,
          fid: 123,
        }),
      );

      expect(mockGetSignerStatus).toHaveBeenCalledWith(specialUuid);
    });
  });

  describe('session persistence', () => {
    it('saves signerUuid to session on success', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'new-signer-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'new-signer-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(200);
      expect(mockSession.signerUuid).toBe('new-signer-uuid');
      expect(mockSession.save).toHaveBeenCalledTimes(1);
    });

    it('persists the exact signerUuid provided in request', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 456 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: 'old-uuid', save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const targetUuid = 'my-exact-signer-uuid';
      const signerStatusResponse = {
        signer_uuid: targetUuid,
        fid: 456,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: targetUuid,
          fid: 456,
        }),
      );

      expect(mockSession.signerUuid).toBe(targetUuid);
      expect(mockSession.save).toHaveBeenCalled();
    });

    it('updates existing signerUuid in session', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 789 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = {
        signerUuid: 'old-signer-uuid',
        save: vi.fn().mockResolvedValue(undefined),
      };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'new-signer-uuid',
        fid: 789,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'new-signer-uuid',
          fid: 789,
        }),
      );

      expect(mockSession.signerUuid).toBe('new-signer-uuid');
      expect(mockSession.save).toHaveBeenCalled();
    });
  });

  describe('response shape', () => {
    it('returns 200 with success true on successful save', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true });
      expect(Object.keys(body).sort()).toEqual(['success']);
    });
  });

  describe('error handling', () => {
    it('returns 500 when getSignerStatus throws an error', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      mockGetSignerStatus.mockRejectedValue(new Error('Neynar API failed'));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'error-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to save signer' });
      expect(mockLogger.error).toHaveBeenCalledWith('Save signer error:', expect.any(Error));
    });

    it('returns 500 when getSession throws an error', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      mockGetSession.mockRejectedValue(new Error('Session error'));

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to save signer' });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('returns 500 when session.save() fails', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = {
        signerUuid: undefined,
        save: vi.fn().mockRejectedValue(new Error('Save failed')),
      };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to save signer' });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('returns 500 when JSON parsing fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const req = makePostRequest('/api/auth/signer/save', {});
      // Create a broken request that will fail JSON parsing
      vi.spyOn(req, 'json').mockRejectedValue(new Error('Invalid JSON'));

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to save signer' });
    });

    it('logs error with context for debugging', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const debugError = new Error('Debug error message');
      mockGetSignerStatus.mockRejectedValue(debugError);

      await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'error-uuid',
          fid: 123,
        }),
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Save signer error:', debugError);
    });

    it('returns 500 when getSignerStatus throws a network error', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const networkError = new Error('ECONNREFUSED');
      mockGetSignerStatus.mockRejectedValue(networkError);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'timeout-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to save signer' });
    });
  });

  describe('integration scenarios', () => {
    it('completes full happy path: validate → verify → save', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'happy-path-uuid',
        fid: 123,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'happy-path-uuid',
          fid: 123,
        }),
      );

      expect(res.status).toBe(200);
      expect(mockGetSignerStatus).toHaveBeenCalledWith('happy-path-uuid');
      expect(mockSession.signerUuid).toBe('happy-path-uuid');
      expect(mockSession.save).toHaveBeenCalled();

      const body = await res.json();
      expect(body).toEqual({ success: true });
    });

    it('stops at FID mismatch and does not call getSignerStatus', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 100 }));

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 200,
        }),
      );

      expect(res.status).toBe(403);
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('stops at ownership verification and does not save session', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 100 }));

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        fid: 200,
        status: 'approved',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'test-uuid',
          fid: 100,
        }),
      );

      expect(res.status).toBe(403);
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('handles multiple sequential requests independently', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession1 = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      const mockSession2 = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };

      mockGetSession
        .mockResolvedValueOnce(mockSession1 as unknown as ReturnType<typeof mockGetSession>)
        .mockResolvedValueOnce(mockSession2 as unknown as ReturnType<typeof mockGetSession>);

      const signerResponse1 = {
        signer_uuid: 'uuid-1',
        fid: 123,
        status: 'approved',
      };
      const signerResponse2 = {
        signer_uuid: 'uuid-2',
        fid: 123,
        status: 'approved',
      };

      mockGetSignerStatus
        .mockResolvedValueOnce(signerResponse1)
        .mockResolvedValueOnce(signerResponse2);

      const res1 = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'uuid-1',
          fid: 123,
        }),
      );

      const res2 = await POST(
        makePostRequest('/api/auth/signer/save', {
          signerUuid: 'uuid-2',
          fid: 123,
        }),
      );

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(mockSession1.signerUuid).toBe('uuid-1');
      expect(mockSession2.signerUuid).toBe('uuid-2');
      expect(mockGetSignerStatus).toHaveBeenCalledTimes(2);
    });
  });
});
