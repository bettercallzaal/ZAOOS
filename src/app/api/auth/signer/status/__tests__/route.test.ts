import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
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

import { GET } from '../route';

describe('GET /api/auth/signer/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when session is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'test-uuid' }),
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'valid-uuid-1234' }),
      );

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });
  });

  describe('query parameter validation', () => {
    it('returns 400 when signer_uuid query parameter is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const res = await GET(makeGetRequest('/api/auth/signer/status'));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Missing signer_uuid' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });

    it('returns 400 when signer_uuid is an empty string', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const res = await GET(makeGetRequest('/api/auth/signer/status', { signer_uuid: '' }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: 'Missing signer_uuid' });
      expect(mockGetSignerStatus).not.toHaveBeenCalled();
    });
  });

  describe('signer status retrieval', () => {
    it('returns 200 with signer status when getSignerStatus succeeds', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 456 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const signerStatusResponse = {
        signer_uuid: 'test-signer-uuid-1',
        status: 'pending_review',
        fid: 456,
        created_at: '2026-07-15T10:00:00Z',
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'test-signer-uuid-1' }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        status: 'pending_review',
        signerUuid: 'test-signer-uuid-1',
      });
      expect(mockGetSignerStatus).toHaveBeenCalledWith('test-signer-uuid-1');
    });

    it('calls getSignerStatus with the provided signer_uuid parameter', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const signerStatusResponse = {
        signer_uuid: 'my-custom-uuid',
        status: 'approved',
        fid: 123,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      await GET(makeGetRequest('/api/auth/signer/status', { signer_uuid: 'my-custom-uuid' }));

      expect(mockGetSignerStatus).toHaveBeenCalledWith('my-custom-uuid');
      expect(mockGetSignerStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('ownership verification', () => {
    it('returns 403 when signer fid does not match session fid', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 100 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        status: 'approved',
        fid: 200, // Different from session fid
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'test-uuid' }),
      );

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: 'Signer does not belong to this user' });
    });

    it('does not verify ownership when signer fid is null', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 100 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const signerStatusResponse = {
        signer_uuid: 'test-uuid',
        status: 'pending_review',
        fid: null, // No FID yet
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'test-uuid' }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('pending_review');
    });

    it('allows ownership check to pass when signer fid matches session fid', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 300 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'matching-uuid',
        status: 'approved',
        fid: 300, // Matches session fid
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'matching-uuid' }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('approved');
    });
  });

  describe('session persistence on approval', () => {
    it('saves signer_uuid to session when status is approved', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'approved-signer-uuid',
        status: 'approved',
        fid: 123,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'approved-signer-uuid' }),
      );

      expect(res.status).toBe(200);
      expect(mockSession.signerUuid).toBe('approved-signer-uuid');
      expect(mockSession.save).toHaveBeenCalled();
    });

    it('does not save signer_uuid when status is not approved', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn() };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'pending-uuid',
        status: 'pending_review',
        fid: 123,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'pending-uuid' }),
      );

      expect(res.status).toBe(200);
      expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('saves signer_uuid when status transitions from pending to approved', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 789 });
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: 'old-uuid', save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'new-approved-uuid',
        status: 'approved',
        fid: 789,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      await GET(makeGetRequest('/api/auth/signer/status', { signer_uuid: 'new-approved-uuid' }));

      expect(mockSession.signerUuid).toBe('new-approved-uuid');
      expect(mockSession.save).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('returns 500 when getSignerStatus throws an error', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      mockGetSignerStatus.mockRejectedValue(new Error('Neynar API failed'));

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'error-uuid' }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to check signer status' });
      expect(mockLogger.error).toHaveBeenCalledWith('Signer status error:', expect.any(Error));
    });

    it('returns 500 and logs error when getSession fails during approval save', async () => {
      const sessionData = mockAuthenticatedSession({ fid: 123 });
      mockGetSessionData.mockResolvedValue(sessionData);

      mockGetSession.mockRejectedValue(new Error('Session error'));

      const signerStatusResponse = {
        signer_uuid: 'approved-uuid',
        status: 'approved',
        fid: 123,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'approved-uuid' }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to check signer status' });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('returns 500 when getSignerStatus throws a network error', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const networkError = new Error('ECONNREFUSED');
      mockGetSignerStatus.mockRejectedValue(networkError);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'timeout-uuid' }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to check signer status' });
    });

    it('logs error details for debugging', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const debugError = new Error('Debug error message');
      mockGetSignerStatus.mockRejectedValue(debugError);

      await GET(makeGetRequest('/api/auth/signer/status', { signer_uuid: 'debug-uuid' }));

      expect(mockLogger.error).toHaveBeenCalledWith('Signer status error:', debugError);
    });
  });

  describe('response shape', () => {
    it('returns correct response shape with status and signerUuid', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const signerStatusResponse = {
        signer_uuid: 'uuid-1234',
        status: 'approved',
        fid: 123,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'uuid-1234' }),
      );

      const body = await res.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('signerUuid');
      expect(Object.keys(body).sort()).toEqual(['signerUuid', 'status']);
    });

    it('returns signerUuid from signer_uuid in Neynar response', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const signerStatusResponse = {
        signer_uuid: 'neynar-format-uuid',
        status: 'pending_review',
        fid: 123,
      };
      mockGetSignerStatus.mockResolvedValue(signerStatusResponse);

      const res = await GET(
        makeGetRequest('/api/auth/signer/status', { signer_uuid: 'neynar-format-uuid' }),
      );

      const body = await res.json();
      expect(body.signerUuid).toBe('neynar-format-uuid');
    });

    it('returns all possible status values correctly', async () => {
      const sessionData = mockAuthenticatedSession();
      mockGetSessionData.mockResolvedValue(sessionData);

      const mockSession = { signerUuid: undefined, save: vi.fn().mockResolvedValue(undefined) };
      mockGetSession.mockResolvedValue(mockSession as unknown as ReturnType<typeof mockGetSession>);

      const statuses = ['pending_review', 'approved', 'rejected', 'expired'];

      for (const status of statuses) {
        mockGetSignerStatus.mockResolvedValue({
          signer_uuid: 'test-uuid',
          status,
          fid: 123,
        });

        const res = await GET(
          makeGetRequest('/api/auth/signer/status', { signer_uuid: 'test-uuid' }),
        );
        const body = await res.json();
        expect(body.status).toBe(status);
      }
    });
  });
});
