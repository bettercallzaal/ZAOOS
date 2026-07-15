import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET } from '../route';

// ── Test data ────────────────────────────────────────────────────────────────
const mockTrack = {
  id: '1',
  title: 'Song Title',
  artist: 'Artist Name',
  artwork_url: 'https://example.com/art.jpg',
  url: 'https://example.com/song',
  stream_url: 'https://stream.example.com/song',
  platform: 'spotify',
  play_count: 5,
  last_played_at: '2026-07-15T10:00:00Z',
};

describe('GET /api/music/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication ───────────────────────────────────────────────────────
  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSession.mockResolvedValue(null);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session has neither fid nor walletAddress', async () => {
      mockGetSession.mockResolvedValue({});

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('allows access with a valid fid', async () => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('allows access with a valid walletAddress', async () => {
      mockGetSession.mockResolvedValue({ walletAddress: '0x123' });
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  // ── Query parameter validation ───────────────────────────────────────────
  describe('query validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 for invalid period enum', async () => {
      const req = makeGetRequest('/api/music/history', { period: 'invalid' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('returns 400 when limit exceeds maximum (100)', async () => {
      const req = makeGetRequest('/api/music/history', { limit: '150' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('returns 400 when limit is less than minimum (1)', async () => {
      const req = makeGetRequest('/api/music/history', { limit: '0' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('returns 400 when offset is negative', async () => {
      const req = makeGetRequest('/api/music/history', { offset: '-1' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('coerces and accepts valid string numbers', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', {
        limit: '10',
        offset: '5',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('uses default values when params are omitted', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tracks).toBeDefined();
      expect(body.total).toBe(1);
    });
  });

  // ── Supabase query construction ──────────────────────────────────────────
  describe('Supabase query', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('always filters by last_played_at not null', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      await GET(req);

      expect(chain.not).toHaveBeenCalledWith('last_played_at', 'is', null);
    });

    it('always orders by last_played_at descending', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      await GET(req);

      expect(chain.order).toHaveBeenCalledWith('last_played_at', {
        ascending: false,
      });
    });

    it('applies range based on offset and limit', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 50,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', {
        limit: '10',
        offset: '20',
      });
      await GET(req);

      expect(chain.range).toHaveBeenCalledWith(20, 29);
    });

    it('does not filter by date when period is "all"', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', { period: 'all' });
      await GET(req);

      expect(chain.gte).not.toHaveBeenCalled();
    });

    it('filters last_played_at for "today" period', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', { period: 'today' });
      await GET(req);

      expect(chain.gte).toHaveBeenCalledWith(
        'last_played_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T00:00:00/),
      );
    });

    it('filters last_played_at for "week" period (default)', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', { period: 'week' });
      await GET(req);

      expect(chain.gte).toHaveBeenCalledWith(
        'last_played_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      );
    });

    it('filters last_played_at for "month" period', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', { period: 'month' });
      await GET(req);

      expect(chain.gte).toHaveBeenCalledWith(
        'last_played_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      );
    });
  });

  // ── Successful responses ─────────────────────────────────────────────────
  describe('success', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 200 with populated tracks', async () => {
      const tracks = [mockTrack, { ...mockTrack, id: '2', title: 'Another Song' }];
      const { chain } = chainMock({
        data: tracks,
        count: 2,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tracks).toEqual(tracks);
      expect(body.total).toBe(2);
      expect(body.hasMore).toBe(false);
    });

    it('returns empty tracks array when no history', async () => {
      const { chain } = chainMock({
        data: [],
        count: 0,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tracks).toEqual([]);
      expect(body.total).toBe(0);
      expect(body.hasMore).toBe(false);
    });

    it('calculates hasMore correctly when more results exist', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 100,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', {
        limit: '10',
        offset: '0',
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.hasMore).toBe(true);
    });

    it('calculates hasMore correctly when at the end', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 25,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history', {
        limit: '10',
        offset: '20',
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.hasMore).toBe(false);
    });

    it('handles undefined data from Supabase gracefully', async () => {
      const { chain } = chainMock({
        data: undefined,
        count: 0,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tracks).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────
  describe('error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when Supabase query fails', async () => {
      const { chain } = chainMock({
        data: null,
        count: null,
        error: { message: 'Database error' },
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch history');
    });

    it('returns 500 when getSupabaseAdmin throws', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Supabase init error');
      });

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });

    it('returns 500 when getSession throws', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'));

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });

    it('logs Supabase errors server-side', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = { message: 'Connection failed' };
      const { chain } = chainMock({
        data: null,
        count: null,
        error: dbError,
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      await GET(req);

      expect(logger.error).toHaveBeenCalledWith('History query error:', dbError);
    });

    it('logs unexpected errors server-side', async () => {
      const { logger } = await import('@/lib/logger');
      mockGetSession.mockRejectedValue(new Error('boom'));

      const req = makeGetRequest('/api/music/history');
      await GET(req);

      expect(logger.error).toHaveBeenCalledWith('History error:', expect.any(Error));
    });
  });

  // ── Supabase thenable chain ──────────────────────────────────────────────
  describe('query chain execution', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('awaits the query chain and receives data', async () => {
      const { chain } = chainMock({
        data: [mockTrack],
        count: 1,
        error: null,
      });
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      chain.then = vi.fn((resolve: (val: unknown) => void) => {
        resolve({
          data: [mockTrack],
          count: 1,
          error: null,
        });
        return Promise.resolve();
      });
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/music/history');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.tracks).toEqual([mockTrack]);
    });
  });
});
