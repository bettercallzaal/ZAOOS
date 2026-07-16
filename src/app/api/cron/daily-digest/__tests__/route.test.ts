import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

// FIFO chain: queries pop results from a queue in order.
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of ['select', 'from', 'gte', 'lte', 'eq', 'like', 'limit', 'order']) {
    chain[m] = vi.fn(() => chain);
  }

  // Terminal method .single() returns a promise that resolves to the next queued result
  chain.single = vi.fn(() => Promise.resolve(q.shift() ?? { data: null, error: null }));

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift() ?? { data: null, error: null });

  return chain;
}

// Create a Supabase mock that returns new FIFO chains on each from() call
function createSupabaseMock(results: Array<{ data?: unknown; error?: unknown; count?: number }>[]) {
  let callIndex = 0;
  return {
    from: vi.fn(() => {
      const chainResults = results[callIndex] || [];
      callIndex++;
      return queuedChain([...chainResults]);
    }),
  };
}

const { mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockGetSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
  supabaseAdmin: new Proxy(
    {},
    {
      get(_target, prop) {
        const admin = mockGetSupabaseAdmin();
        return (admin as Record<string | symbol, unknown>)[prop];
      },
    },
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: vi.fn(),
}));

import { autoCastToZao } from '@/lib/publish/auto-cast';
import { GET } from '../route';

describe('GET /api/cron/daily-digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test-secret');
    vi.stubEnv('ZAO_OFFICIAL_SIGNER_UUID', 'signer-uuid-123');
    vi.stubEnv('ZAO_OFFICIAL_NEYNAR_API_KEY', 'neynar-key-abc');
  });

  describe('environment configuration', () => {
    it('returns 500 when CRON_SECRET is not configured', async () => {
      vi.stubEnv('CRON_SECRET', '');
      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('CRON_SECRET not configured');
    });
  });

  describe('bearer token authentication', () => {
    it('returns 401 when authorization header is missing', async () => {
      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when authorization header has wrong token', async () => {
      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer wrong-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when authorization header lacks Bearer prefix', async () => {
      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('accepts correct Bearer token', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 2 }],
          [{ data: null, error: null, count: 5 }],
          [{ data: null, error: null, count: 1 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(autoCastToZao as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });
  });

  describe('supabase stat queries', () => {
    it('queries active users (last_login_at within EST day)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 3 }],
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 0 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      await GET(req);

      const mockFrom = mockGetSupabaseAdmin().from as ReturnType<typeof vi.fn>;
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('queries play_history for tracks played', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 7 }],
          [{ data: null, error: null, count: 0 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      await GET(req);

      const mockFrom = mockGetSupabaseAdmin().from as ReturnType<typeof vi.fn>;
      expect(mockFrom).toHaveBeenCalledWith('play_history');
    });

    it('queries rooms for rooms hosted', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 2 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      await GET(req);

      const mockFrom = mockGetSupabaseAdmin().from as ReturnType<typeof vi.fn>;
      expect(mockFrom).toHaveBeenCalledWith('rooms');
    });

    it('handles partial failures (one query fails, others succeed)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: 'DB error', count: undefined }],
          [{ data: null, error: null, count: 5 }],
          [{ data: null, error: null, count: 1 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-456');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      // activeMembers = 0 (due to error), tracksPlayed = 5, roomsHosted = 1
      expect(res.status).toBe(200);
      expect(body.stats.activeMembers).toBe(0);
      expect(body.stats.tracksPlayed).toBe(5);
      expect(body.stats.roomsHosted).toBe(1);
      expect(body.posted).toBe(true);
    });
  });

  describe('activity check and digest posting', () => {
    it('returns early without posting when no activity', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 0 }],
        ]),
      );

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.posted).toBe(false);
      expect(body.reason).toBe('No activity today');
      expect(body.stats.activeMembers).toBe(0);
      expect(body.stats.tracksPlayed).toBe(0);
      expect(body.stats.roomsHosted).toBe(0);
      expect(autoCastToZao).not.toHaveBeenCalled();
    });

    it('posts digest when there is active member activity', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 5 }],
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 0 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.posted).toBe(true);
      expect(body.castHash).toBe('cast-hash-123');
      expect(autoCastToZao).toHaveBeenCalled();
    });

    it('posts digest when there is track play activity', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 3 }],
          [{ data: null, error: null, count: 0 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-456');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const _res = await GET(req);

      expect(autoCastToZao as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });

    it('posts digest when there is room hosting activity', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 0 }],
          [{ data: null, error: null, count: 2 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-789');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const _res = await GET(req);

      expect(autoCastToZao as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });

    it('includes all stats in digest text', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 10 }],
          [{ data: null, error: null, count: 42 }],
          [{ data: null, error: null, count: 3 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-xyz');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.posted).toBe(true);
      expect(body.stats.activeMembers).toBe(10);
      expect(body.stats.tracksPlayed).toBe(42);
      expect(body.stats.roomsHosted).toBe(3);

      // Verify autoCastToZao was called with correct text
      const callArgs = (autoCastToZao as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toContain('10 active members');
      expect(callArgs[0]).toContain('42 tracks played');
      expect(callArgs[0]).toContain('3 rooms hosted');
    });

    it('passes embed URL to autoCastToZao', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('cast-hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      await GET(req);

      const callArgs = (autoCastToZao as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1]).toBe('https://zaoos.com');
    });
  });

  describe('response format', () => {
    it('returns 200 with posted=true when cast hash is returned', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('hash-abc123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.posted).toBe(true);
      expect(body.castHash).toBe('hash-abc123');
    });

    it('returns 200 with posted=false when cast hash is null', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.posted).toBe(false);
      expect(body.castHash).toBeNull();
    });

    it('includes stats in all responses', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 5 }],
          [{ data: null, error: null, count: 10 }],
          [{ data: null, error: null, count: 2 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockResolvedValueOnce('hash-123');

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.stats).toBeDefined();
      expect(body.stats.activeMembers).toBe(5);
      expect(body.stats.tracksPlayed).toBe(10);
      expect(body.stats.roomsHosted).toBe(2);
    });
  });

  describe('error handling', () => {
    it('returns 500 when autoCastToZao throws', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
          [{ data: null, error: null, count: 1 }],
        ]),
      );
      (autoCastToZao as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Farcaster API error'),
      );

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('returns 500 when supabase queries throw', async () => {
      mockGetSupabaseAdmin.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('handles unknown error types gracefully', async () => {
      mockGetSupabaseAdmin.mockImplementationOnce(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'Unknown error type';
      });

      const req = makeRequest('/api/cron/daily-digest', {
        method: 'GET',
        headers: { authorization: 'Bearer test-secret' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});
