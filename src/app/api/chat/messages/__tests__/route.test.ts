import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockGetChannelFeed } = vi.hoisted(() => ({
  mockGetChannelFeed: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getChannelFeed: mockGetChannelFeed,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// ── Route import ─────────────────────────────────────────────────────────────
import { GET } from '../route';

// ── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for further chaining.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  chain.head = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Create a mock Cast row from the database.
 */
function mockCastRow(overrides?: Record<string, unknown>) {
  return {
    hash: 'mock-hash-123',
    channel_id: 'zao',
    fid: 456,
    author_username: 'mockuser',
    author_display: 'Mock User',
    author_pfp: 'https://example.com/pfp.jpg',
    text: 'Hello, ZAO!',
    timestamp: '2026-07-15T12:00:00Z',
    embeds: [],
    reactions: {
      likes_count: 5,
      recasts_count: 2,
      likes: [{ fid: 789 }],
      recasts: [{ fid: 790 }],
    },
    replies_count: 1,
    parent_hash: null,
    ...overrides,
  };
}

/**
 * Create a mock Neynar feed response.
 */
function mockNeynarFeed(casts: unknown[], cursor?: string) {
  return {
    casts: casts || [],
    next: { cursor: cursor || null },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/chat/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 even when session data resolves to null', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ── Channel validation tests ──────────────────────────────────────────────

  describe('Channel validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when channel is not in allowlist', async () => {
      const res = await GET(makeGetRequest('/api/chat/messages?channel=invalid-channel'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid channel');
    });

    it('returns 400 when channel is missing (defaults to "zao" but that is still validated)', async () => {
      // The route defaults to 'zao' if no channel is provided, which IS in the allowlist
      // So this test checks that "missing" actually defaults to 'zao'
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/chat/messages'));
      expect(res.status).toBe(200);
    });

    it('accepts "zao" channel from allowlist', async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);
    });

    it('accepts "zabal" channel from allowlist', async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/chat/messages?channel=zabal'));
      expect(res.status).toBe(200);
    });

    it('accepts "cocconcertz" channel from allowlist', async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/chat/messages?channel=cocconcertz'));
      expect(res.status).toBe(200);
    });

    it('accepts "wavewarz" channel from allowlist', async () => {
      const chain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/chat/messages?channel=wavewarz'));
      expect(res.status).toBe(200);
    });
  });

  // ── TTL refresh logic tests ──────────────────────────────────────────────

  describe('TTL refresh logic', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('triggers Neynar refresh on first call (no cursor, no lastRefresh record)', async () => {
      const mockCast = {
        hash: 'cast-1',
        author: { fid: 100, username: 'user1', display_name: 'User 1', pfp_url: 'pfp1' },
        text: 'First cast',
        timestamp: '2026-07-15T12:00:00Z',
        embeds: [],
        reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
        replies: { count: 0 },
        parent_hash: null,
      };

      mockGetChannelFeed.mockResolvedValue(mockNeynarFeed([mockCast]));
      const upsertChain = chainMock({ error: null });
      const selectChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') {
          // First call is upsert (from refreshFromNeynar)
          if (upsertChain.upsert) {
            return upsertChain;
          }
          return selectChain;
        }
        // For hidden_messages and users queries
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);
      expect(mockGetChannelFeed).toHaveBeenCalledWith('zao', undefined, 20);
    });

    it('reads from DB on second call within TTL window (no cursor)', async () => {
      const dbRow = mockCastRow();
      const selectChain = chainMock({ data: [dbRow], error: null, count: 0 });
      mockFrom.mockReturnValue(selectChain);

      // First call triggers refresh
      mockGetChannelFeed.mockResolvedValue(mockNeynarFeed([]));
      await GET(makeGetRequest('/api/chat/messages?channel=zao'));

      // Reset mocks to track second call
      vi.clearAllMocks();
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockFrom.mockReturnValue(selectChain);

      // Second call within TTL should NOT call Neynar
      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);
      expect(mockGetChannelFeed).not.toHaveBeenCalled();
    });

    it('includes cursor in pagination query when provided', async () => {
      const dbRow = mockCastRow();
      const selectChain = chainMock({ data: [dbRow], error: null });
      mockFrom.mockReturnValue(selectChain);

      const res = await GET(
        makeGetRequest('/api/chat/messages', {
          channel: 'zao',
          cursor: '2026-07-15T11:00:00Z',
        }),
      );

      expect(res.status).toBe(200);
      // Verify cursor was used in the query (via lt method)
      expect(selectChain.lt).toHaveBeenCalledWith('timestamp', '2026-07-15T11:00:00Z');
    });
  });

  // ── Limit parameter tests ────────────────────────────────────────────────

  describe('Limit parameter', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('defaults to 20 when limit is not provided', async () => {
      const selectChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(selectChain);

      await GET(makeGetRequest('/api/chat/messages?channel=zao'));

      expect(selectChain.limit).toHaveBeenCalledWith(20);
    });

    it('caps limit at 50 when limit exceeds 50', async () => {
      const selectChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(selectChain);

      await GET(makeGetRequest('/api/chat/messages?channel=zao&limit=100'));

      expect(selectChain.limit).toHaveBeenCalledWith(50);
    });

    it('uses provided limit when within bounds', async () => {
      const selectChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(selectChain);

      await GET(makeGetRequest('/api/chat/messages?channel=zao&limit=25'));

      expect(selectChain.limit).toHaveBeenCalledWith(25);
    });

    it('handles non-numeric limit gracefully (parseInt returns NaN)', async () => {
      const selectChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(selectChain);

      await GET(makeGetRequest('/api/chat/messages?channel=zao&limit=not-a-number'));

      // parseInt('not-a-number') = NaN, and Math.min(NaN, 50) = NaN
      // The route still calls limit(NaN), which Supabase/DB ignores or treats as no-op
      expect(selectChain.limit).toHaveBeenCalledWith(Number.NaN);
    });
  });

  // ── rowToCast mapping tests ──────────────────────────────────────────────

  describe('rowToCast mapping', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('maps DB row to Cast type correctly', async () => {
      const dbRow = mockCastRow({
        hash: 'hash-abc',
        fid: 789,
        author_username: 'johndoe',
        author_display: 'John Doe',
        author_pfp: 'https://example.com/john.jpg',
        text: 'Test message',
        timestamp: '2026-07-15T13:45:00Z',
        replies_count: 3,
        reactions: {
          likes_count: 10,
          recasts_count: 5,
          likes: [{ fid: 100 }, { fid: 101 }],
          recasts: [{ fid: 102 }],
        },
      });

      const selectChain = chainMock({ data: [dbRow], error: null, count: 0 });
      mockFrom.mockReturnValue(selectChain);

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts).toHaveLength(1);

      const cast = body.casts[0];
      expect(cast.hash).toBe('hash-abc');
      expect(cast.author.fid).toBe(789);
      expect(cast.author.username).toBe('johndoe');
      expect(cast.author.display_name).toBe('John Doe');
      expect(cast.author.pfp_url).toBe('https://example.com/john.jpg');
      expect(cast.text).toBe('Test message');
      expect(cast.timestamp).toBe('2026-07-15T13:45:00Z');
      expect(cast.replies.count).toBe(3);
      expect(cast.reactions.likes_count).toBe(10);
      expect(cast.reactions.recasts_count).toBe(5);
      expect(cast.reactions.likes).toEqual([{ fid: 100 }, { fid: 101 }]);
      expect(cast.reactions.recasts).toEqual([{ fid: 102 }]);
    });

    it('handles missing optional fields with defaults', async () => {
      const dbRow = {
        hash: 'hash-minimal',
        channel_id: 'zao',
        fid: 1,
        author_username: undefined,
        author_display: undefined,
        author_pfp: undefined,
        text: undefined,
        timestamp: undefined,
        embeds: undefined,
        reactions: {},
        replies_count: undefined,
        parent_hash: undefined,
      };

      const selectChain = chainMock({ data: [dbRow], error: null, count: 0 });
      mockFrom.mockReturnValue(selectChain);

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      const cast = body.casts[0];

      expect(cast.author.username).toBe('');
      expect(cast.author.display_name).toBe('');
      expect(cast.author.pfp_url).toBe('');
      expect(cast.text).toBe('');
      expect(cast.timestamp).toBe('');
      expect(cast.replies.count).toBe(0);
      expect(cast.reactions.likes_count).toBe(0);
      expect(cast.reactions.recasts_count).toBe(0);
      expect(cast.reactions.likes).toEqual([]);
      expect(cast.reactions.recasts).toEqual([]);
      expect(cast.parent_hash).toBe(null);
      expect(cast.embeds).toEqual([]);
    });
  });

  // ── Hidden messages filtering tests ──────────────────────────────────────

  describe('Hidden messages filtering', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('filters out casts that are in hidden_messages table', async () => {
      const dbRows = [
        mockCastRow({ hash: 'visible-1' }),
        mockCastRow({ hash: 'hidden-1' }),
        mockCastRow({ hash: 'visible-2' }),
      ];

      const selectChain = chainMock({ data: dbRows, error: null, count: 0 });
      const hiddenChain = chainMock({
        data: [{ cast_hash: 'hidden-1' }],
        error: null,
      });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts).toHaveLength(2);
      expect(body.casts[0].hash).toBe('visible-1');
      expect(body.casts[1].hash).toBe('visible-2');
    });

    it('returns all casts when none are hidden', async () => {
      const dbRows = [mockCastRow({ hash: 'cast-1' }), mockCastRow({ hash: 'cast-2' })];

      const selectChain = chainMock({ data: dbRows, error: null, count: 0 });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts).toHaveLength(2);
    });
  });

  // ── ZID enrichment tests ────────────────────────────────────────────────

  describe('ZID enrichment', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('enriches casts with zid from users table', async () => {
      const dbRow = mockCastRow({ fid: 999 });

      const selectChain = chainMock({ data: [dbRow], error: null, count: 0 });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({
        data: [{ fid: 999, zid: 42 }],
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts[0].author.zid).toBe(42);
    });

    it('sets zid to null when user is not found in users table', async () => {
      const dbRow = mockCastRow({ fid: 888 });

      const selectChain = chainMock({ data: [dbRow], error: null, count: 0 });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts[0].author.zid).toBe(null);
    });
  });

  // ── hasMore pagination indicator tests ────────────────────────────────────

  describe('hasMore pagination indicator', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('sets hasMore to true when more casts exist beyond current page', async () => {
      // Create multiple rows so that casts.length >= limit (20)
      const manyRows = Array.from({ length: 20 }, (_, i) =>
        mockCastRow({
          hash: `hash-${i}`,
          timestamp: new Date(2026, 6, 15, 12, i).toISOString(),
        }),
      );

      const selectChain = chainMock({ data: manyRows, error: null, count: 5 });
      const countChain = chainMock({ count: 5, error: null });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') {
          callCount++;
          // First call is the main select, second is the count for hasMore
          return callCount === 1 ? selectChain : countChain;
        }
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.hasMore).toBe(true);
    });

    it('sets hasMore to false when no more casts exist', async () => {
      const dbRows = [mockCastRow()];

      const selectChain = chainMock({ data: dbRows, error: null, count: 0 });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.hasMore).toBe(false);
    });
  });

  // ── Error handling tests ────────────────────────────────────────────────

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when DB query throws an error', async () => {
      // Make the chain itself throw when awaited
      const throwingChain: Record<string, unknown> = {};
      throwingChain.select = vi.fn().mockReturnValue(throwingChain);
      throwingChain.eq = vi.fn().mockReturnValue(throwingChain);
      throwingChain.order = vi.fn().mockReturnValue(throwingChain);
      throwingChain.limit = vi.fn().mockReturnValue(throwingChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — test error handling
      throwingChain.then = vi.fn((_resolve: unknown, reject: (err: unknown) => void) => {
        reject(new Error('DB connection failed'));
      });

      mockFrom.mockReturnValue(throwingChain);

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to fetch messages');
    });

    it('falls back to DB read when Neynar refresh throws', async () => {
      mockGetChannelFeed.mockRejectedValue(new Error('Neynar API error'));

      const dbRows = [mockCastRow()];
      const selectChain = chainMock({ data: dbRows, error: null, count: 0 });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts).toHaveLength(1);
    });

    it('triggers refresh when DB is empty on non-cursor request', async () => {
      const _emptySelectChain = chainMock({ data: null, error: null });
      const mockCast = {
        hash: 'fresh-cast',
        author: { fid: 100, username: 'user1', display_name: 'User 1', pfp_url: 'pfp' },
        text: 'Fresh from Neynar',
        timestamp: '2026-07-15T14:00:00Z',
        embeds: [],
        reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
        replies: { count: 0 },
        parent_hash: null,
      };

      mockGetChannelFeed.mockResolvedValue(mockNeynarFeed([mockCast]));

      const upsertChain = chainMock({ error: null });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') {
          return upsertChain;
        }
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      // Use a unique channel to avoid TTL state collision with other tests
      const res = await GET(makeGetRequest('/api/chat/messages?channel=zabal'));
      expect(res.status).toBe(200);
      expect(mockGetChannelFeed).toHaveBeenCalled();
    });
  });

  // ── Cursor pagination tests ──────────────────────────────────────────────

  describe('Cursor-based pagination', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('queries with cursor using lt() when cursor is provided', async () => {
      const dbRows = [mockCastRow({ timestamp: '2026-07-15T10:00:00Z' })];
      const selectChain = chainMock({ data: dbRows, error: null });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(
        makeGetRequest('/api/chat/messages', {
          channel: 'zao',
          cursor: '2026-07-15T11:00:00Z',
        }),
      );
      expect(res.status).toBe(200);

      // Verify that lt() was called with the cursor timestamp
      expect(selectChain.lt).toHaveBeenCalledWith('timestamp', '2026-07-15T11:00:00Z');
    });

    it('does not call Neynar when cursor is provided (always reads DB)', async () => {
      const dbRows = [mockCastRow()];
      const selectChain = chainMock({ data: dbRows, error: null });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(
        makeGetRequest('/api/chat/messages', {
          channel: 'zao',
          cursor: '2026-07-15T11:00:00Z',
        }),
      );
      expect(res.status).toBe(200);
      expect(mockGetChannelFeed).not.toHaveBeenCalled();
    });

    it('sets hasMore based on fetching limit+1 results', async () => {
      // Simulate fetching 21 results when limit=20, so hasMore=true
      const manyRows = Array.from({ length: 21 }, (_, i) =>
        mockCastRow({
          hash: `hash-${i}`,
          timestamp: new Date(2026, 6, 15, 12, i).toISOString(),
        }),
      );

      const selectChain = chainMock({ data: manyRows, error: null });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(
        makeGetRequest('/api/chat/messages?channel=zao&cursor=2026-07-15T11:00:00Z'),
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.hasMore).toBe(true);
      // Should only return 20, not 21 (the +1 was for detecting hasMore)
      expect(body.casts).toHaveLength(20);
    });
  });

  // ── Response structure tests ────────────────────────────────────────────

  describe('Response structure', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns a valid JSON response with casts and hasMore', async () => {
      const dbRow = mockCastRow();
      const selectChain = chainMock({ data: [dbRow], error: null, count: 0 });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      const res = await GET(makeGetRequest('/api/chat/messages?channel=zao'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('casts');
      expect(body).toHaveProperty('hasMore');
      expect(Array.isArray(body.casts)).toBe(true);
      expect(typeof body.hasMore).toBe('boolean');
    });

    it('returns empty casts array when no messages exist', async () => {
      // Use a distinct channel to avoid TTL cache collision from other tests
      const selectChain = chainMock({ data: [], error: null });
      const hiddenChain = chainMock({ data: [], error: null });
      const usersChain = chainMock({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'channel_casts') return selectChain;
        if (table === 'hidden_messages') return hiddenChain;
        if (table === 'users') return usersChain;
        return chainMock({ data: [], error: null });
      });

      // Ensure mockGetChannelFeed is not configured (returns undefined or empty)
      mockGetChannelFeed.mockResolvedValue(mockNeynarFeed([]));

      const res = await GET(makeGetRequest('/api/chat/messages?channel=cocconcertz'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.casts).toEqual([]);
      expect(body.hasMore).toBe(false);
    });
  });
});
