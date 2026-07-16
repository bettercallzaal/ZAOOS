import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSession, mockGetHindsightClient } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetHindsightClient: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/hindsight', () => ({
  getHindsightClient: () => mockGetHindsightClient(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/memory/[userId]/recall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockUnauthenticatedSession());
    mockGetHindsightClient.mockResolvedValue(null);
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockGetHindsightClient).not.toHaveBeenCalled();
    });

    it('proceeds when session exists with valid fid', async () => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/456/recall?q=test'), {
        params: Promise.resolve({ userId: '456' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetHindsightClient).toHaveBeenCalled();
    });
  });

  describe('authorization (user can only access their own memories)', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 403 when session fid does not match userId', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/999/recall?q=test'), {
        params: Promise.resolve({ userId: '999' }),
      });
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden');
      expect(hindsightMock.recall).not.toHaveBeenCalled();
    });

    it('succeeds when session fid matches userId (numeric comparison)', async () => {
      const hindsightMock = {
        recall: vi
          .fn()
          .mockResolvedValue([{ content: 'test memory', score: 0.95, metadata: { type: 'note' } }]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(res.status).toBe(200);
      expect(hindsightMock.recall).toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);
    });

    it('returns 400 when query (q) is missing', async () => {
      const res = await GET(makeGetRequest('/api/memory/123/recall'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when query is empty string', async () => {
      const res = await GET(makeGetRequest('/api/memory/123/recall?q='), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when query exceeds max length (500 chars)', async () => {
      const longQuery = 'x'.repeat(501);
      const res = await GET(
        makeGetRequest(`/api/memory/123/recall?q=${encodeURIComponent(longQuery)}`),
        {
          params: Promise.resolve({ userId: '123' }),
        },
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts query up to max length (500 chars)', async () => {
      const query = 'x'.repeat(500);
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(
        makeGetRequest(`/api/memory/123/recall?q=${encodeURIComponent(query)}`),
        {
          params: Promise.resolve({ userId: '123' }),
        },
      );

      expect(res.status).toBe(200);
      expect(hindsightMock.recall).toHaveBeenCalledWith('123', query, { limit: 10 });
    });

    it('returns 400 when limit is not a positive integer', async () => {
      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test&limit=-5'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when limit exceeds max (100)', async () => {
      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test&limit=101'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('uses default limit of 10 when not specified', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(hindsightMock.recall).toHaveBeenCalledWith('123', 'test', { limit: 10 });
    });

    it('coerces numeric-string limit to integer', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      await GET(makeGetRequest('/api/memory/123/recall?q=test&limit=25'), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(hindsightMock.recall).toHaveBeenCalledWith('123', 'test', { limit: 25 });
    });

    it('accepts limit up to max (100)', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      await GET(makeGetRequest('/api/memory/123/recall?q=test&limit=100'), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(hindsightMock.recall).toHaveBeenCalledWith('123', 'test', { limit: 100 });
    });
  });

  describe('hindsight client errors', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 503 when hindsight client is not available', async () => {
      mockGetHindsightClient.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBe('Hindsight not available');
    });

    it('returns 500 when hindsight recall throws an error', async () => {
      const hindsightMock = {
        recall: vi.fn().mockRejectedValue(new Error('Hindsight service down')),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to recall memories');
    });
  });

  describe('successful recall', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns recalled memories with all fields', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([
          {
            content: 'First memory about ZAO',
            score: 0.95,
            metadata: { type: 'note', date: '2026-01-01' },
          },
          {
            content: 'Second memory about coworking',
            score: 0.87,
            metadata: { type: 'meeting' },
          },
        ]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=ZAO'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.memories).toHaveLength(2);
      expect(body.memories[0]).toEqual({
        content: 'First memory about ZAO',
        score: 0.95,
        metadata: { type: 'note', date: '2026-01-01' },
      });
      expect(body.memories[1]).toEqual({
        content: 'Second memory about coworking',
        score: 0.87,
        metadata: { type: 'meeting' },
      });
    });

    it('returns empty memories array when no matches found', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=nonexistent'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.memories).toEqual([]);
    });

    it('filters response to include only content, score, and metadata fields', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([
          {
            content: 'Test memory',
            score: 0.9,
            metadata: { key: 'value' },
            extraField: 'should be excluded',
            internalId: 'xyz',
          },
        ]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.memories[0]).not.toHaveProperty('extraField');
      expect(body.memories[0]).not.toHaveProperty('internalId');
      expect(body.memories[0]).toEqual({
        content: 'Test memory',
        score: 0.9,
        metadata: { key: 'value' },
      });
    });

    it('handles memories without metadata', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([
          {
            content: 'Memory without metadata',
            score: 0.85,
          },
        ]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.memories[0]).toEqual({
        content: 'Memory without metadata',
        score: 0.85,
        metadata: undefined,
      });
    });

    it('respects the limit parameter passed to hindsight', async () => {
      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      await GET(makeGetRequest('/api/memory/123/recall?q=search&limit=50'), {
        params: Promise.resolve({ userId: '123' }),
      });

      expect(hindsightMock.recall).toHaveBeenCalledWith('123', 'search', { limit: 50 });
    });
  });

  describe('dynamic route parameters', () => {
    it('reads userId from params promise', async () => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const testUserId = '789';
      const res = await GET(makeGetRequest('/api/memory/789/recall?q=test'), {
        params: Promise.resolve({ userId: testUserId }),
      });

      expect(res.status).toBe(200);
      expect(hindsightMock.recall).toHaveBeenCalledWith(testUserId, 'test', { limit: 10 });
    });

    it('correctly handles userId as string even when fid is number', async () => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const hindsightMock = {
        recall: vi.fn().mockResolvedValue([]),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/456/recall?q=test'), {
        params: Promise.resolve({ userId: '456' }),
      });

      expect(res.status).toBe(200);
      expect(hindsightMock.recall).toHaveBeenCalledWith('456', 'test', { limit: 10 });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('catches and logs errors in try/catch', async () => {
      mockGetHindsightClient.mockImplementationOnce(() => {
        throw new Error('Unexpected error during client initialization');
      });

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to recall memories');
    });

    it('returns 500 with appropriate error message on internal server error', async () => {
      const hindsightMock = {
        recall: vi.fn().mockRejectedValue(new Error('Database connection lost')),
      };
      mockGetHindsightClient.mockResolvedValue(hindsightMock);

      const res = await GET(makeGetRequest('/api/memory/123/recall?q=test'), {
        params: Promise.resolve({ userId: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to recall memories');
      expect(body).not.toHaveProperty('details');
    });
  });
});
