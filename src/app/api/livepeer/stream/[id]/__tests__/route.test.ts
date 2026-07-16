import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ===== Hoisted mocks =====
const { mockGetSessionData, mockLivepeerStreamGet, mockLivepeerStreamDelete } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockLivepeerStreamGet: vi.fn(),
  mockLivepeerStreamDelete: vi.fn(),
}));

// ===== Module mocks =====
vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('livepeer', () => ({
  Livepeer: vi.fn(() => ({
    stream: {
      get: mockLivepeerStreamGet,
      delete: mockLivepeerStreamDelete,
    },
  })),
}));

// Dynamically set the env var before importing the route
beforeEach(() => {
  process.env.LIVEPEER_API_KEY = 'test-livepeer-key';
});

import { DELETE, GET } from '../route';

// ===== Test fixtures =====

const mockStreamResponse = {
  stream: {
    id: 'stream-test-123',
    isActive: true,
    playbackId: 'playback-xyz-789',
    record: true,
  },
};

const validSession = mockAuthenticatedSession({ fid: 456, username: 'testuser' });
const validStreamId = 'stream-test-123';

describe('GET /api/livepeer/stream/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    mockLivepeerStreamGet.mockClear();
    mockLivepeerStreamDelete.mockClear();
  });

  // ===== GET: SUCCESSFUL RETRIEVAL =====
  describe('successful stream retrieval', () => {
    beforeEach(() => {
      mockLivepeerStreamGet.mockResolvedValue(mockStreamResponse);
    });

    it('returns 200 with stream data when stream exists', async () => {
      const res = await GET(
        makeRequest('/api/livepeer/stream/stream-test-123', { method: 'GET' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({
        stream: {
          id: 'stream-test-123',
          isActive: true,
          playbackId: 'playback-xyz-789',
          record: true,
        },
      });
    });

    it('calls livepeer.stream.get with correct id parameter', async () => {
      const testId = 'stream-abc-456';
      mockLivepeerStreamGet.mockResolvedValue(mockStreamResponse);

      await GET(makeRequest('/api/livepeer/stream/stream-abc-456', { method: 'GET' }), {
        params: Promise.resolve({ id: testId }),
      });

      expect(mockLivepeerStreamGet).toHaveBeenCalledWith(testId);
      expect(mockLivepeerStreamGet).toHaveBeenCalledTimes(1);
    });

    it('extracts stream fields correctly from Livepeer response', async () => {
      mockLivepeerStreamGet.mockResolvedValue({
        stream: {
          id: 'stream-xyz',
          isActive: false,
          playbackId: 'playback-456',
          record: false,
          extraField: 'should-be-ignored',
        },
      });

      const res = await GET(makeRequest('/api/livepeer/stream/stream-xyz', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-xyz' }),
      });
      const body = (await res.json()) as { stream?: object };

      expect(body.stream).toEqual({
        id: 'stream-xyz',
        isActive: false,
        playbackId: 'playback-456',
        record: false,
      });
    });

    it('handles stream with null playbackId', async () => {
      mockLivepeerStreamGet.mockResolvedValue({
        stream: {
          id: 'stream-123',
          isActive: true,
          playbackId: null,
          record: true,
        },
      });

      const res = await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });
      const body = (await res.json()) as { stream?: unknown };

      expect(body.stream).toEqual({
        id: 'stream-123',
        isActive: true,
        playbackId: null,
        record: true,
      });
    });
  });

  // ===== GET: MISSING LIVEPEER_API_KEY =====
  describe('missing LIVEPEER_API_KEY', () => {
    it('returns 500 when LIVEPEER_API_KEY is not configured', async () => {
      delete process.env.LIVEPEER_API_KEY;

      const res = await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to get stream');
    });
  });

  // ===== GET: SDK ERRORS =====
  describe('Livepeer SDK errors', () => {
    it('returns 500 when livepeer.stream.get throws', async () => {
      mockLivepeerStreamGet.mockRejectedValue(new Error('Stream not found'));

      const res = await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to get stream');
    });

    it('logs SDK errors via logger.error', async () => {
      mockLivepeerStreamGet.mockRejectedValue(new Error('API failure'));

      await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });

      const { logger } = await import('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith('Get Livepeer stream error:', expect.any(Error));
    });

    it('handles network timeout as SDK error', async () => {
      const timeoutError = new Error('Network timeout');
      mockLivepeerStreamGet.mockRejectedValue(timeoutError);

      const res = await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });

      expect(res.status).toBe(500);
    });
  });

  // ===== GET: DYNAMIC PARAM HANDLING =====
  describe('dynamic param handling', () => {
    beforeEach(() => {
      mockLivepeerStreamGet.mockResolvedValue(mockStreamResponse);
    });

    it('resolves params Promise correctly', async () => {
      const testId = 'stream-promise-test';

      await GET(makeRequest('/api/livepeer/stream/stream-promise-test', { method: 'GET' }), {
        params: Promise.resolve({ id: testId }),
      });

      expect(mockLivepeerStreamGet).toHaveBeenCalledWith(testId);
    });

    it('handles stream id with special characters', async () => {
      const specialId = 'stream-test_123-abc';

      mockLivepeerStreamGet.mockResolvedValue({
        stream: { id: specialId, isActive: true, playbackId: 'pb-1', record: false },
      });

      const res = await GET(makeRequest(`/api/livepeer/stream/${specialId}`, { method: 'GET' }), {
        params: Promise.resolve({ id: specialId }),
      });

      expect(res.status).toBe(200);
      expect(mockLivepeerStreamGet).toHaveBeenCalledWith(specialId);
    });

    it('handles long stream id correctly', async () => {
      const longId = `stream-${'x'.repeat(100)}`;

      mockLivepeerStreamGet.mockResolvedValue({
        stream: { id: longId, isActive: true, playbackId: 'pb', record: false },
      });

      const res = await GET(makeRequest(`/api/livepeer/stream/${longId}`, { method: 'GET' }), {
        params: Promise.resolve({ id: longId }),
      });

      expect(res.status).toBe(200);
      expect(mockLivepeerStreamGet).toHaveBeenCalledWith(longId);
    });
  });

  // ===== GET: EDGE CASES =====
  describe('edge cases', () => {
    it('handles empty stream object in response', async () => {
      mockLivepeerStreamGet.mockResolvedValue({
        stream: undefined,
      });

      const res = await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });
      const body = (await res.json()) as { stream?: object };

      expect(res.status).toBe(200);
      expect(body.stream).toEqual({
        id: undefined,
        isActive: undefined,
        playbackId: undefined,
        record: undefined,
      });
    });

    it('returns 200 even if stream.id is missing from response', async () => {
      mockLivepeerStreamGet.mockResolvedValue({
        stream: {
          isActive: true,
          playbackId: 'pb-123',
        },
      });

      const res = await GET(makeRequest('/api/livepeer/stream/stream-123', { method: 'GET' }), {
        params: Promise.resolve({ id: 'stream-123' }),
      });

      expect(res.status).toBe(200);
    });
  });
});

describe('DELETE /api/livepeer/stream/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    mockLivepeerStreamGet.mockClear();
    mockLivepeerStreamDelete.mockClear();
  });

  // ===== DELETE: AUTHENTICATION =====
  describe('authentication', () => {
    it('returns 401 when no session is provided', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when getSessionData returns null', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('allows DELETE when session is present', async () => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockLivepeerStreamDelete.mockResolvedValue(undefined);

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );

      expect(res.status).toBe(200);
      expect(mockLivepeerStreamDelete).toHaveBeenCalled();
    });

    it('checks session before calling Livepeer SDK', async () => {
      mockGetSessionData.mockResolvedValue(null);

      await DELETE(makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }), {
        params: Promise.resolve({ id: validStreamId }),
      });

      // Should not call SDK if unauthenticated
      expect(mockLivepeerStreamDelete).not.toHaveBeenCalled();
    });
  });

  // ===== DELETE: SUCCESSFUL DELETION =====
  describe('successful stream deletion', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockLivepeerStreamDelete.mockResolvedValue(undefined);
    });

    it('returns 200 with success message', async () => {
      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { success?: boolean };

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('calls livepeer.stream.delete with correct id parameter', async () => {
      const testId = 'stream-to-delete-456';

      await DELETE(makeRequest(`/api/livepeer/stream/${testId}`, { method: 'DELETE' }), {
        params: Promise.resolve({ id: testId }),
      });

      expect(mockLivepeerStreamDelete).toHaveBeenCalledWith(testId);
      expect(mockLivepeerStreamDelete).toHaveBeenCalledTimes(1);
    });

    it('does not call stream.get before deleting', async () => {
      await DELETE(makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }), {
        params: Promise.resolve({ id: validStreamId }),
      });

      expect(mockLivepeerStreamGet).not.toHaveBeenCalled();
    });
  });

  // ===== DELETE: MISSING LIVEPEER_API_KEY =====
  describe('missing LIVEPEER_API_KEY', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 500 when LIVEPEER_API_KEY is not configured', async () => {
      delete process.env.LIVEPEER_API_KEY;

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to delete stream');
    });
  });

  // ===== DELETE: SDK ERRORS =====
  describe('Livepeer SDK errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('returns 500 when livepeer.stream.delete throws', async () => {
      mockLivepeerStreamDelete.mockRejectedValue(new Error('Stream deletion failed'));

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to delete stream');
    });

    it('logs SDK errors via logger.error', async () => {
      mockLivepeerStreamDelete.mockRejectedValue(new Error('API failure'));

      await DELETE(makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }), {
        params: Promise.resolve({ id: validStreamId }),
      });

      const { logger } = await import('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith('Delete Livepeer stream error:', expect.any(Error));
    });

    it('returns 500 on network errors', async () => {
      const networkError = new Error('Network unreachable');
      mockLivepeerStreamDelete.mockRejectedValue(networkError);

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );

      expect(res.status).toBe(500);
    });

    it('handles "not found" SDK errors gracefully', async () => {
      const notFoundError = new Error('Stream not found');
      mockLivepeerStreamDelete.mockRejectedValue(notFoundError);

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { error?: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to delete stream');
    });
  });

  // ===== DELETE: DYNAMIC PARAM HANDLING =====
  describe('dynamic param handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
      mockLivepeerStreamDelete.mockResolvedValue(undefined);
    });

    it('resolves params Promise correctly', async () => {
      const testId = 'stream-promise-delete-test';

      await DELETE(makeRequest(`/api/livepeer/stream/${testId}`, { method: 'DELETE' }), {
        params: Promise.resolve({ id: testId }),
      });

      expect(mockLivepeerStreamDelete).toHaveBeenCalledWith(testId);
    });

    it('handles stream id with hyphens and underscores', async () => {
      const specialId = 'stream-test_123-abc_xyz';

      await DELETE(makeRequest(`/api/livepeer/stream/${specialId}`, { method: 'DELETE' }), {
        params: Promise.resolve({ id: specialId }),
      });

      expect(mockLivepeerStreamDelete).toHaveBeenCalledWith(specialId);
      expect(mockLivepeerStreamDelete).toHaveBeenCalledTimes(1);
    });

    it('handles long stream id correctly', async () => {
      const longId = `stream-${'x'.repeat(100)}`;
      mockLivepeerStreamDelete.mockResolvedValue(undefined);

      const res = await DELETE(
        makeRequest(`/api/livepeer/stream/${longId}`, { method: 'DELETE' }),
        { params: Promise.resolve({ id: longId }) },
      );

      expect(res.status).toBe(200);
      expect(mockLivepeerStreamDelete).toHaveBeenCalledWith(longId);
    });
  });

  // ===== DELETE: EDGE CASES =====
  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(validSession);
    });

    it('handles empty stream id gracefully', async () => {
      mockLivepeerStreamDelete.mockRejectedValue(new Error('Invalid stream id'));

      const res = await DELETE(makeRequest('/api/livepeer/stream/', { method: 'DELETE' }), {
        params: Promise.resolve({ id: '' }),
      });

      expect(res.status).toBe(500);
    });

    it('allows deletion of stream with special Livepeer-formatted id', async () => {
      const livepeerFormattedId = 'stream-live-1234567890';
      mockLivepeerStreamDelete.mockResolvedValue(undefined);

      const res = await DELETE(
        makeRequest(`/api/livepeer/stream/${livepeerFormattedId}`, { method: 'DELETE' }),
        { params: Promise.resolve({ id: livepeerFormattedId }) },
      );

      expect(res.status).toBe(200);
      expect(mockLivepeerStreamDelete).toHaveBeenCalledWith(livepeerFormattedId);
    });

    it('returns success even if stream.delete returns void', async () => {
      mockLivepeerStreamDelete.mockResolvedValue(undefined);

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      const body = (await res.json()) as { success?: boolean };

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  // ===== DELETE: SESSION VALIDATION =====
  describe('session validation details', () => {
    it('respects different session FIDs', async () => {
      const session1 = mockAuthenticatedSession({ fid: 111, username: 'user1' });
      const session2 = mockAuthenticatedSession({ fid: 222, username: 'user2' });

      mockGetSessionData.mockResolvedValue(session1);
      mockLivepeerStreamDelete.mockResolvedValue(undefined);

      const res1 = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );
      expect(res1.status).toBe(200);

      mockGetSessionData.mockResolvedValue(session2);

      const res2 = await DELETE(
        makeRequest('/api/livepeer/stream/stream-456', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'stream-456' }) },
      );
      expect(res2.status).toBe(200);
      expect(mockLivepeerStreamDelete).toHaveBeenCalledTimes(2);
    });

    it('allows admin session to delete', async () => {
      const adminSession = mockAuthenticatedSession({ isAdmin: true });
      mockGetSessionData.mockResolvedValue(adminSession);
      mockLivepeerStreamDelete.mockResolvedValue(undefined);

      const res = await DELETE(
        makeRequest('/api/livepeer/stream/stream-123', { method: 'DELETE' }),
        { params: Promise.resolve({ id: validStreamId }) },
      );

      expect(res.status).toBe(200);
    });
  });
});
