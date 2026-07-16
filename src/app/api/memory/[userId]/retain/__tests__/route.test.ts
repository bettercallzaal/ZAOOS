import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockGetHindsightClient } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetHindsightClient: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSessionData(),
}));

vi.mock('@/lib/hindsight', () => ({
  getHindsightClient: () => mockGetHindsightClient(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/**
 * Mock hindsight client with a retain method that returns a result object.
 */
function mockHindsightClient(returnValue: unknown = { id: 'mem-123' }) {
  return {
    retain: vi.fn().mockResolvedValue(returnValue),
  };
}

describe('POST /api/memory/[userId]/retain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockGetHindsightClient.mockResolvedValue(mockHindsightClient());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockGetHindsightClient).not.toHaveBeenCalled();
    });

    it('proceeds when session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const res = await POST(
        makePostRequest('/api/memory/456/retain', {
          content: 'test memory',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '456' }) },
      );

      expect(res.status).toBe(201);
      expect(mockGetHindsightClient).toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('returns 403 when userId does not match session fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const res = await POST(
        makePostRequest('/api/memory/999/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '999' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden');
      expect(mockGetHindsightClient).not.toHaveBeenCalled();
    });

    it('allows request when userId matches session fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

      const res = await POST(
        makePostRequest('/api/memory/789/retain', {
          content: 'my memory',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '789' }) },
      );

      expect(res.status).toBe(201);
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when content is missing', async () => {
      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when content is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: '',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when content exceeds max length', async () => {
      const longContent = 'x'.repeat(10001);
      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: longContent,
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when eventType is missing', async () => {
      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when eventType is invalid', async () => {
      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'invalid_type',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid eventTypes', async () => {
      const validEventTypes = [
        'cast',
        'track_share',
        'respect',
        'room_participation',
        'profile_update',
        'reaction',
        'governance_vote',
      ];

      for (const eventType of validEventTypes) {
        const res = await POST(
          makePostRequest('/api/memory/123/retain', {
            content: 'test',
            eventType,
          }),
          { params: Promise.resolve({ userId: '123' }) },
        );
        expect(res.status).toBe(201);
      }
    });

    it('returns 500 when request.json() throws', async () => {
      const req = new (require('next/server').NextRequest)(
        new URL('/api/memory/123/retain', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'not json',
        },
      );

      const res = await POST(req, { params: Promise.resolve({ userId: '123' }) });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to retain memory');
    });
  });

  describe('hindsight client handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 503 when hindsight client is not available', async () => {
      mockGetHindsightClient.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBe('Hindsight client not available');
    });

    it('calls retain with correct parameters', async () => {
      const hindsightClient = mockHindsightClient();
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'my memory content',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );

      expect(hindsightClient.retain).toHaveBeenCalledWith('123', 'my memory content', {
        metadata: {
          eventType: 'cast',
        },
      });
    });

    it('includes metadata in retain call when provided', async () => {
      const hindsightClient = mockHindsightClient();
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'my memory content',
          eventType: 'cast',
          metadata: {
            roomId: 'room-123',
            timestamp: 1234567890,
          },
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );

      expect(hindsightClient.retain).toHaveBeenCalledWith('123', 'my memory content', {
        metadata: {
          eventType: 'cast',
          roomId: 'room-123',
          timestamp: 1234567890,
        },
      });
    });
  });

  describe('success response', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 201 with memoryId from result.id', async () => {
      const hindsightClient = mockHindsightClient({ id: 'mem-abc123' });
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.memoryId).toBe('mem-abc123');
    });

    it('returns 201 with memoryId from result.memoryId when id is missing', async () => {
      const hindsightClient = mockHindsightClient({ memoryId: 'mem-xyz789' });
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.memoryId).toBe('mem-xyz789');
    });

    it('returns 201 with entire result when neither id nor memoryId present', async () => {
      const resultObject = { data: 'some result' };
      const hindsightClient = mockHindsightClient(resultObject);
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.memoryId).toEqual(resultObject);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockGetHindsightClient.mockResolvedValue(mockHindsightClient());
    });

    it('returns 500 when hindsight retain throws', async () => {
      const hindsightClient = mockHindsightClient();
      hindsightClient.retain.mockRejectedValue(new Error('Network error'));
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      const res = await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to retain memory');
    });

    it('logs error on failure', async () => {
      const { logger } = await import('@/lib/logger');
      const hindsightClient = mockHindsightClient();
      const testError = new Error('Test error');
      hindsightClient.retain.mockRejectedValue(testError);
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      await POST(
        makePostRequest('/api/memory/123/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '123' }) },
      );

      expect(logger.error).toHaveBeenCalledWith('Failed to retain memory:', testError);
    });
  });

  describe('dynamic route parameters', () => {
    it('reads userId from params promise', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
      const hindsightClient = mockHindsightClient();
      mockGetHindsightClient.mockResolvedValue(hindsightClient);

      const res = await POST(
        makePostRequest('/api/memory/999/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '999' }) },
      );

      expect(res.status).toBe(201);
      expect(hindsightClient.retain).toHaveBeenCalledWith('999', 'test', expect.any(Object));
    });

    it('compares userId as strings for authorization', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 555 }));

      const res = await POST(
        makePostRequest('/api/memory/555/retain', {
          content: 'test',
          eventType: 'cast',
        }),
        { params: Promise.resolve({ userId: '555' }) },
      );

      expect(res.status).toBe(201);
    });
  });
});
