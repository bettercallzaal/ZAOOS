import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZABAL_TOKEN_ADDRESS } from '@/lib/empire-builder/config';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockSession, mockDiscoverLeaderboards, mockGetLeaderboard, mockWithCache } = vi.hoisted(
  () => ({
    mockSession: { fid: undefined as number | undefined },
    mockDiscoverLeaderboards: vi.fn(),
    mockGetLeaderboard: vi.fn(),
    mockWithCache: vi.fn(),
  }),
);

vi.mock('@/lib/auth/session', () => ({
  getSession: () => Promise.resolve(mockSession),
}));

vi.mock('@/lib/empire-builder/client', () => ({
  discoverLeaderboards: mockDiscoverLeaderboards,
  getLeaderboard: mockGetLeaderboard,
}));

vi.mock('@/lib/empire-builder/cache', () => ({
  withCache: mockWithCache,
  DEFAULT_TTL_MS: 60000,
}));

import { GET } from '../route';

describe('GET /api/empire-builder/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.fid = undefined;
  });

  describe('authentication', () => {
    it('returns 401 when session.fid is falsy', async () => {
      mockSession.fid = undefined;
      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('unauthorized');
      expect(mockDiscoverLeaderboards).not.toHaveBeenCalled();
    });

    it('returns 401 when session.fid is 0', async () => {
      mockSession.fid = 0;
      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('unauthorized');
    });

    it('accepts authenticated request with valid fid', async () => {
      mockSession.fid = 123;
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockDiscoverLeaderboards).toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    beforeEach(() => {
      mockSession.fid = 123;
    });

    it('accepts valid optional slot parameter', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([
        { id: 'slot1', name: 'Slot 1', leaderboard_type: 'global' },
      ]);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: '0' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('accepts valid optional tokenAddress parameter', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const customTokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const req = makeGetRequest('/api/empire-builder/leaderboard', {
        tokenAddress: customTokenAddress,
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('returns 200 with valid optional parameters', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([
        { id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' },
      ]);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard', {
        slot: '0',
        tokenAddress: 'valid_address',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe('leaderboard discovery', () => {
    beforeEach(() => {
      mockSession.fid = 123;
    });

    it('uses ZABAL_TOKEN_ADDRESS by default when tokenAddress not provided', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      await GET(req);

      expect(mockDiscoverLeaderboards).toHaveBeenCalledWith(ZABAL_TOKEN_ADDRESS);
    });

    it('uses supplied tokenAddress when provided', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const customTokenAddress = '0xaabbccddaabbccddaabbccddaabbccddaabbccdd';
      const req = makeGetRequest('/api/empire-builder/leaderboard', {
        tokenAddress: customTokenAddress,
      });
      await GET(req);

      expect(mockDiscoverLeaderboards).toHaveBeenCalledWith(customTokenAddress);
    });

    it('calls withCache with correct cache key and TTL', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      await GET(req);

      const callArgs = mockWithCache.mock.calls[0];
      expect(callArgs[0]).toBe(`eb:slots:${ZABAL_TOKEN_ADDRESS}`);
      expect(callArgs[1]).toBe(60000 * 5); // DEFAULT_TTL_MS * 5
    });

    it('returns empty leaderboard when no slots discovered', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.slots).toEqual([]);
      expect(body.data.leaderboard).toBeNull();
      expect(mockGetLeaderboard).not.toHaveBeenCalled();
    });
  });

  describe('leaderboard selection', () => {
    beforeEach(() => {
      mockSession.fid = 123;
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
    });

    it('selects slot by index when slot parameter provided', async () => {
      const slots = [
        { id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' },
        { id: 'slot1', name: 'Slot 1', leaderboard_type: 'personal' },
      ];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: '1' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.active.id).toBe('slot1');
      expect(body.data.active.index).toBe(1);
      expect(mockGetLeaderboard).toHaveBeenCalledWith('slot1');
    });

    it('defaults to first slot when slot parameter not provided', async () => {
      const slots = [
        { id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' },
        { id: 'slot1', name: 'Slot 1', leaderboard_type: 'personal' },
      ];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.active.id).toBe('slot0');
      expect(body.data.active.index).toBe(0);
    });

    it('defaults to first slot when slot index is out of bounds', async () => {
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: '5' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.active.id).toBe('slot0');
    });

    it('defaults to first slot when slot is negative', async () => {
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: '-1' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.active.id).toBe('slot0');
    });

    it('defaults to first slot when slot is not a number', async () => {
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: 'invalid' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.active.id).toBe('slot0');
    });
  });

  describe('response structure', () => {
    beforeEach(() => {
      mockSession.fid = 123;
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
    });

    it('returns correct response structure on success', async () => {
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      const leaderboard = { entries: [{ rank: 1, address: '0xabc', score: 100 }] };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('slots');
      expect(body.data).toHaveProperty('active');
      expect(body.data).toHaveProperty('leaderboard');
    });

    it('transforms slots to include index and type', async () => {
      const slots = [
        { id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' },
        { id: 'slot1', name: 'Slot 1', leaderboard_type: 'personal' },
      ];
      const leaderboard = { entries: [] };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(body.data.slots).toEqual([
        { index: 0, id: 'slot0', name: 'Slot 0', type: 'global' },
        { index: 1, id: 'slot1', name: 'Slot 1', type: 'personal' },
      ]);
    });

    it('includes leaderboard data in response', async () => {
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      const leaderboard = {
        entries: [
          { rank: 1, address: '0xabc', score: 100 },
          { rank: 2, address: '0xdef', score: 90 },
        ],
      };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(body.data.leaderboard).toEqual(leaderboard);
    });

    it('sets correct active slot index when multiple slots exist', async () => {
      const slots = [
        { id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' },
        { id: 'slot1', name: 'Slot 1', leaderboard_type: 'personal' },
        { id: 'slot2', name: 'Slot 2', leaderboard_type: 'daily' },
      ];
      const leaderboard = { entries: [] };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard);

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: '2' });
      const res = await GET(req);
      const body = await res.json();

      expect(body.data.active).toEqual({ index: 2, id: 'slot2' });
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      mockSession.fid = 123;
    });

    it('uses withCache for leaderboards discovery', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce([]);

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      await GET(req);

      expect(mockWithCache).toHaveBeenCalledWith(
        expect.stringContaining('eb:slots:'),
        expect.any(Number),
        expect.any(Function),
      );
    });

    it('uses withCache for leaderboard fetch with correct TTL', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce({ entries: [] });

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      await GET(req);

      // Second withCache call should be for the leaderboard
      const secondCall = mockWithCache.mock.calls[1];
      expect(secondCall[0]).toBe('eb:leaderboard:slot0');
      expect(secondCall[1]).toBe(60000); // DEFAULT_TTL_MS without multiplier
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockSession.fid = 123;
    });

    it('returns 502 when discoverLeaderboards throws', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockRejectedValueOnce(new Error('API error'));

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.success).toBe(false);
      expect(body.error).toBe('leaderboard_unavailable');
    });

    it('returns 502 when getLeaderboard throws', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      const slots = [{ id: 'slot0', name: 'Slot 0', leaderboard_type: 'global' }];
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockRejectedValueOnce(new Error('Fetch failed'));

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('leaderboard_unavailable');
    });

    it('returns 502 when withCache throws', async () => {
      mockWithCache.mockRejectedValueOnce(new Error('Cache error'));

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('leaderboard_unavailable');
    });

    it('handles non-Error thrown exceptions', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockRejectedValueOnce('raw string error');

      const req = makeGetRequest('/api/empire-builder/leaderboard');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('leaderboard_unavailable');
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      mockSession.fid = 123;
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
    });

    it('handles full happy path with multiple slots', async () => {
      const slots = [
        { id: 'slot0', name: 'Global', leaderboard_type: 'global' },
        { id: 'slot1', name: 'Weekly', leaderboard_type: 'weekly' },
      ];
      const leaderboard = {
        entries: [
          { rank: 1, address: '0x111', score: 1000 },
          { rank: 2, address: '0x222', score: 900 },
          { rank: 3, address: '0x333', score: 800 },
        ],
      };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard);

      const req = makeGetRequest('/api/empire-builder/leaderboard', { slot: '0' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.slots).toHaveLength(2);
      expect(body.data.active.id).toBe('slot0');
      expect(body.data.leaderboard.entries).toHaveLength(3);
    });

    it('handles switching between slots', async () => {
      const slots = [
        { id: 'slot0', name: 'Global', leaderboard_type: 'global' },
        { id: 'slot1', name: 'Weekly', leaderboard_type: 'weekly' },
      ];
      const leaderboard1 = { entries: [{ rank: 1, address: '0x111', score: 1000 }] };
      const leaderboard2 = { entries: [{ rank: 1, address: '0x222', score: 500 }] };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard1);

      // First request with slot 0
      const req1 = makeGetRequest('/api/empire-builder/leaderboard', { slot: '0' });
      const res1 = await GET(req1);
      const body1 = await res1.json();

      expect(body1.data.active.id).toBe('slot0');
      expect(body1.data.leaderboard).toEqual(leaderboard1);

      // Reset mock for second request
      vi.clearAllMocks();
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard2);

      // Second request with slot 1
      const req2 = makeGetRequest('/api/empire-builder/leaderboard', { slot: '1' });
      const res2 = await GET(req2);
      const body2 = await res2.json();

      expect(body2.data.active.id).toBe('slot1');
      expect(body2.data.leaderboard).toEqual(leaderboard2);
    });

    it('handles custom tokenAddress parameter end-to-end', async () => {
      const customTokenAddress = '0x9999999999999999999999999999999999999999';
      const slots = [{ id: 'custom-slot', name: 'Custom', leaderboard_type: 'global' }];
      const leaderboard = { entries: [] };

      mockDiscoverLeaderboards.mockResolvedValueOnce(slots);
      mockGetLeaderboard.mockResolvedValueOnce(leaderboard);

      const req = makeGetRequest('/api/empire-builder/leaderboard', {
        tokenAddress: customTokenAddress,
      });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockDiscoverLeaderboards).toHaveBeenCalledWith(customTokenAddress);
    });
  });
});
