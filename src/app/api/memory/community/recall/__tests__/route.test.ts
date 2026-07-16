import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

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

describe('GET /api/memory/community/recall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ fid: 123 });
  });

  // =========================================================================
  // Auth guard tests
  // =========================================================================

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 401 when session has no fid', async () => {
    mockGetSession.mockResolvedValue({});
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // =========================================================================
  // Query validation tests
  // =========================================================================

  it('returns 400 when q is missing', async () => {
    const res = await GET(makeGetRequest('/api/memory/community/recall'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid input');
    expect(json.details).toBeDefined();
  });

  it('returns 400 when q is empty string', async () => {
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: '' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid input');
  });

  it('returns 400 when q exceeds 500 characters', async () => {
    const longQuery = 'a'.repeat(501);
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: longQuery }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid input');
  });

  it('returns 400 when limit is not a positive integer', async () => {
    const res = await GET(
      makeGetRequest('/api/memory/community/recall', { q: 'test', limit: '-5' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit exceeds 100', async () => {
    const res = await GET(
      makeGetRequest('/api/memory/community/recall', { q: 'test', limit: '101' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit is not a number', async () => {
    const res = await GET(
      makeGetRequest('/api/memory/community/recall', { q: 'test', limit: 'abc' }),
    );
    expect(res.status).toBe(400);
  });

  // =========================================================================
  // Query parameter coercion tests
  // =========================================================================

  it('uses default limit of 10 when limit is omitted', async () => {
    const mockRecall = vi.fn().mockResolvedValue([]);
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    await GET(makeGetRequest('/api/memory/community/recall', { q: 'memory search' }));
    expect(mockRecall).toHaveBeenCalledWith('zao-community', 'memory search', { limit: 10 });
  });

  it('coerces numeric-string limit to number', async () => {
    const mockRecall = vi.fn().mockResolvedValue([]);
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    await GET(makeGetRequest('/api/memory/community/recall', { q: 'test', limit: '25' }));
    expect(mockRecall).toHaveBeenCalledWith('zao-community', 'test', { limit: 25 });
  });

  // =========================================================================
  // Success tests
  // =========================================================================

  it('returns empty memories array when hindsight returns no results', async () => {
    const mockRecall = vi.fn().mockResolvedValue([]);
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'nonexistent' }));
    expect(res.status).toBe(200);
    expect((await res.json()).memories).toEqual([]);
  });

  it('returns memories with content, score, and metadata', async () => {
    const mockResults = [
      {
        content: 'ZAO ecosystem grants program details',
        score: 0.95,
        metadata: { source: 'doc_123', created_at: '2026-01-01' },
      },
      {
        content: 'Community voting mechanism explanation',
        score: 0.87,
        metadata: { source: 'doc_456' },
      },
    ];
    const mockRecall = vi.fn().mockResolvedValue(mockResults);
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'grants' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.memories).toHaveLength(2);
    expect(json.memories[0]).toEqual({
      content: 'ZAO ecosystem grants program details',
      score: 0.95,
      metadata: { source: 'doc_123', created_at: '2026-01-01' },
    });
    expect(json.memories[1]).toEqual({
      content: 'Community voting mechanism explanation',
      score: 0.87,
      metadata: { source: 'doc_456' },
    });
  });

  it('includes undefined metadata when hindsight result omits it', async () => {
    const mockResults = [
      {
        content: 'Some memory',
        score: 0.9,
      },
    ];
    const mockRecall = vi.fn().mockResolvedValue(mockResults);
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    const json = await res.json();
    expect(json.memories[0].metadata).toBeUndefined();
  });

  it('passes correct bank ID and query to hindsight.recall()', async () => {
    const mockRecall = vi.fn().mockResolvedValue([]);
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    await GET(
      makeGetRequest('/api/memory/community/recall', { q: 'community history', limit: '5' }),
    );
    expect(mockRecall).toHaveBeenCalledWith('zao-community', 'community history', { limit: 5 });
  });

  // =========================================================================
  // Hindsight availability tests
  // =========================================================================

  it('returns 503 when hindsight client is not available', async () => {
    mockGetHindsightClient.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('Hindsight not available');
  });

  // =========================================================================
  // Error handling tests
  // =========================================================================

  it('returns 500 when hindsight.recall() throws an error', async () => {
    const mockRecall = vi.fn().mockRejectedValue(new Error('hindsight service error'));
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to recall community memories');
  });

  it('returns 500 when getHindsightClient() throws an error', async () => {
    mockGetHindsightClient.mockRejectedValue(new Error('client initialization failed'));
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to recall community memories');
  });

  it('returns 500 when session check throws unexpectedly', async () => {
    mockGetSession.mockRejectedValue(new Error('session error'));
    const res = await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to recall community memories');
  });

  it('logs errors to the logger on 500 response', async () => {
    const { logger } = await import('@/lib/logger');
    const mockRecall = vi.fn().mockRejectedValue(new Error('database timeout'));
    mockGetHindsightClient.mockResolvedValue({ recall: mockRecall });

    await GET(makeGetRequest('/api/memory/community/recall', { q: 'test' }));
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to recall community memories:',
      expect.any(Error),
    );
  });
});
