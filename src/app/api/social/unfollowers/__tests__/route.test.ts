import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Chain whose chainable methods return the chain for further chaining.
 * Terminal await (`then`) resolves to the provided result.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/social/unfollowers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET();
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('Unauthorized');
    });

    it('returns 400 when session has no fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));
      const res = await GET();
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('No Farcaster account linked');
    });

    it('returns 400 when session fid is null', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: null as unknown as number }),
      );
      const res = await GET();
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('No Farcaster account linked');
    });
  });

  describe('Query Construction', () => {
    it('queries unfollow_events with the correct columns', async () => {
      const chain = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await GET();
      expect(chain.select).toHaveBeenCalledWith(
        'id, unfollower_fid, unfollower_username, unfollower_display_name, detected_at',
      );
    });

    it('filters by the session user fid', async () => {
      const chain = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
      await GET();
      expect(chain.eq).toHaveBeenCalledWith('member_fid', 456);
    });

    it('orders by detected_at descending', async () => {
      const chain = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await GET();
      expect(chain.order).toHaveBeenCalledWith('detected_at', { ascending: false });
    });

    it('limits results to 50', async () => {
      const chain = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await GET();
      expect(chain.limit).toHaveBeenCalledWith(50);
    });

    it('queries the unfollow_events table', async () => {
      const chain = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      await GET();
      expect(mockFrom).toHaveBeenCalledWith('unfollow_events');
    });
  });

  describe('Response Structure', () => {
    it('returns 200 with empty unfollowers list', async () => {
      mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        unfollowers: [],
        total: 0,
      });
    });

    it('returns unfollowers with all expected fields', async () => {
      const unfollowerData = [
        {
          id: 'uf-1',
          unfollower_fid: 111,
          unfollower_username: 'alice',
          unfollower_display_name: 'Alice',
          detected_at: '2026-07-15T10:00:00Z',
        },
        {
          id: 'uf-2',
          unfollower_fid: 222,
          unfollower_username: 'bob',
          unfollower_display_name: 'Bob',
          detected_at: '2026-07-15T09:00:00Z',
        },
      ];
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.unfollowers).toEqual(unfollowerData);
      expect(body.total).toBe(2);
    });

    it('returns correct count for multiple unfollowers', async () => {
      const unfollowerData = Array.from({ length: 25 }, (_, i) => ({
        id: `uf-${i}`,
        unfollower_fid: 1000 + i,
        unfollower_username: `user${i}`,
        unfollower_display_name: `User ${i}`,
        detected_at: new Date(Date.now() - i * 3600000).toISOString(),
      }));
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.total).toBe(25);
      expect(body.unfollowers.length).toBe(25);
    });

    it('returns total as 0 when data is null', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.unfollowers).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when the query errors', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db connection failed') }));
      const res = await GET();
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to fetch unfollowers');
    });

    it('logs the database error when query fails', async () => {
      const dbError = new Error('network timeout');
      mockFrom.mockReturnValue(makeChain({ data: null, error: dbError }));
      const { logger } = await import('@/lib/logger');
      await GET();
      expect(logger.error).toHaveBeenCalledWith('Unfollowers query error:', dbError);
    });

    it('returns 500 on unexpected exception during query', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('unexpected exception');
      });
      const res = await GET();
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Internal server error');
    });

    it('logs the exception when query throws', async () => {
      const error = new Error('async operation failed');
      mockFrom.mockImplementation(() => {
        throw error;
      });
      const { logger } = await import('@/lib/logger');
      await GET();
      expect(logger.error).toHaveBeenCalledWith('Unfollowers route error:', error);
    });

    it('returns 500 when getSessionData throws', async () => {
      mockGetSessionData.mockRejectedValue(new Error('session error'));
      const res = await GET();
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Internal server error');
    });
  });

  describe('Unfollower Data Integrity', () => {
    it('preserves all unfollower fields in response', async () => {
      const unfollowerData = [
        {
          id: 'uf-complete',
          unfollower_fid: 999,
          unfollower_username: 'charlie',
          unfollower_display_name: 'Charlie Brown',
          detected_at: '2026-07-15T08:30:00Z',
        },
      ];
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.unfollowers[0]).toHaveProperty('id');
      expect(body.unfollowers[0]).toHaveProperty('unfollower_fid');
      expect(body.unfollowers[0]).toHaveProperty('unfollower_username');
      expect(body.unfollowers[0]).toHaveProperty('unfollower_display_name');
      expect(body.unfollowers[0]).toHaveProperty('detected_at');
    });

    it('maintains order from database (descending by detected_at)', async () => {
      const unfollowerData = [
        {
          id: 'uf-1',
          unfollower_fid: 100,
          unfollower_username: 'first',
          unfollower_display_name: 'First',
          detected_at: '2026-07-15T12:00:00Z',
        },
        {
          id: 'uf-2',
          unfollower_fid: 200,
          unfollower_username: 'second',
          unfollower_display_name: 'Second',
          detected_at: '2026-07-15T11:00:00Z',
        },
        {
          id: 'uf-3',
          unfollower_fid: 300,
          unfollower_username: 'third',
          unfollower_display_name: 'Third',
          detected_at: '2026-07-15T10:00:00Z',
        },
      ];
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.unfollowers[0].detected_at).toBe('2026-07-15T12:00:00Z');
      expect(body.unfollowers[1].detected_at).toBe('2026-07-15T11:00:00Z');
      expect(body.unfollowers[2].detected_at).toBe('2026-07-15T10:00:00Z');
    });
  });

  describe('Multi-User Isolation', () => {
    it('queries only unfollowers for the authenticated user', async () => {
      const chain = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
      await GET();
      expect(chain.eq).toHaveBeenCalledWith('member_fid', 789);
    });

    it('uses different fid for different sessions', async () => {
      const chain1 = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain1);
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 111 }));
      await GET();
      expect(chain1.eq).toHaveBeenCalledWith('member_fid', 111);

      vi.clearAllMocks();
      const chain2 = makeChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain2);
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 222 }));
      await GET();
      expect(chain2.eq).toHaveBeenCalledWith('member_fid', 222);
    });
  });

  describe('Response Content-Type', () => {
    it('returns JSON response', async () => {
      mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
      const res = await GET();
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Large Result Sets', () => {
    it('handles limit of 50 unfollowers', async () => {
      const unfollowerData = Array.from({ length: 50 }, (_, i) => ({
        id: `uf-${i}`,
        unfollower_fid: 2000 + i,
        unfollower_username: `user${i}`,
        unfollower_display_name: `User ${i}`,
        detected_at: new Date(Date.now() - i * 3600000).toISOString(),
      }));
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.unfollowers.length).toBe(50);
      expect(body.total).toBe(50);
    });

    it('returns exact count even at limit boundary', async () => {
      const unfollowerData = Array.from({ length: 50 }, (_, i) => ({
        id: `uf-${i}`,
        unfollower_fid: 3000 + i,
        unfollower_username: `user${i}`,
        unfollower_display_name: `User ${i}`,
        detected_at: new Date(Date.now() - i * 60000).toISOString(),
      }));
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.total).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('handles single unfollower', async () => {
      const unfollowerData = [
        {
          id: 'uf-solo',
          unfollower_fid: 5555,
          unfollower_username: 'loner',
          unfollower_display_name: 'Lone User',
          detected_at: '2026-07-15T07:00:00Z',
        },
      ];
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.unfollowers.length).toBe(1);
    });

    it('handles empty string in optional fields gracefully', async () => {
      const unfollowerData = [
        {
          id: 'uf-empty',
          unfollower_fid: 6666,
          unfollower_username: '',
          unfollower_display_name: '',
          detected_at: '2026-07-15T06:00:00Z',
        },
      ];
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      const body = await res.json();
      expect(body.unfollowers[0].unfollower_username).toBe('');
      expect(body.unfollowers[0].unfollower_display_name).toBe('');
    });

    it('returns 200 even if unfollower fields are partially populated', async () => {
      const unfollowerData = [
        {
          id: 'uf-partial',
          unfollower_fid: 7777,
          unfollower_username: 'partial',
          unfollower_display_name: null,
          detected_at: '2026-07-15T05:00:00Z',
        },
      ];
      mockFrom.mockReturnValue(makeChain({ data: unfollowerData, error: null }));
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.unfollowers[0].unfollower_display_name).toBeNull();
    });
  });
});
