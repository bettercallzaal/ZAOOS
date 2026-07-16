import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockSession, mockGetZabalSnapshot, mockWithCache } = vi.hoisted(() => ({
  mockSession: { fid: undefined as number | undefined },
  mockGetZabalSnapshot: vi.fn(),
  mockWithCache: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: () => Promise.resolve(mockSession),
}));

vi.mock('@/lib/empire-builder/client', () => ({
  getZabalSnapshot: mockGetZabalSnapshot,
}));

vi.mock('@/lib/empire-builder/cache', () => ({
  withCache: mockWithCache,
  DEFAULT_TTL_MS: 60000,
}));

import { GET } from '../route';

describe('GET /api/empire-builder/snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.fid = undefined;
  });

  describe('authentication', () => {
    it('returns 401 when session.fid is falsy', async () => {
      mockSession.fid = undefined;
      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('unauthorized');
      expect(mockGetZabalSnapshot).not.toHaveBeenCalled();
    });

    it('returns 401 when session.fid is 0', async () => {
      mockSession.fid = 0;
      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
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
      mockGetZabalSnapshot.mockResolvedValueOnce({
        empire: null,
        topLeaderboard: null,
        rewardsSummary: null,
        totals: {
          lifetimeDistributedUsd: 0,
          lifetimeBurned: 0,
          distributionCount: 0,
          burnCount: 0,
        },
      });

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();

      expect(res.status).toBe(200);
      expect(mockGetZabalSnapshot).toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      mockSession.fid = 123;
    });

    it('calls withCache with correct cache key and DEFAULT_TTL_MS', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockGetZabalSnapshot.mockResolvedValueOnce({
        empire: null,
        topLeaderboard: null,
        rewardsSummary: null,
        totals: {
          lifetimeDistributedUsd: 0,
          lifetimeBurned: 0,
          distributionCount: 0,
          burnCount: 0,
        },
      });

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      await GET();

      expect(mockWithCache).toHaveBeenCalledWith('eb:zabal:snapshot', 60000, expect.any(Function));
    });

    it('returns cached value without calling getZabalSnapshot again', async () => {
      const cachedSnapshot = {
        empire: { id: 'zabal', name: 'ZABAL' },
        topLeaderboard: { entries: [] },
        rewardsSummary: { empire_rewards: [], burned: [] },
        totals: {
          lifetimeDistributedUsd: 1000,
          lifetimeBurned: 500,
          distributionCount: 10,
          burnCount: 5,
        },
      };

      mockSession.fid = 123;
      mockWithCache.mockResolvedValueOnce(cachedSnapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();

      expect(mockWithCache).toHaveBeenCalled();
      expect(mockGetZabalSnapshot).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });

  describe('success path', () => {
    beforeEach(() => {
      mockSession.fid = 123;
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
    });

    it('returns 200 with snapshot data on success', async () => {
      const snapshot = {
        empire: { id: 'zabal', name: 'ZABAL', symbol: 'ZABAL' },
        topLeaderboard: { id: 'board1', entries: [{ rank: 1, address: '0xabc', score: 100 }] },
        rewardsSummary: {
          empire_rewards: [{ amount_usd: '500' }],
          burned: [{ amount: '100' }],
        },
        totals: {
          lifetimeDistributedUsd: 500,
          lifetimeBurned: 100,
          distributionCount: 1,
          burnCount: 1,
        },
      };

      mockGetZabalSnapshot.mockResolvedValueOnce(snapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(snapshot);
    });

    it('returns correct response structure', async () => {
      const snapshot = {
        empire: null,
        topLeaderboard: null,
        rewardsSummary: null,
        totals: {
          lifetimeDistributedUsd: 0,
          lifetimeBurned: 0,
          distributionCount: 0,
          burnCount: 0,
        },
      };

      mockGetZabalSnapshot.mockResolvedValueOnce(snapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('empire');
      expect(body.data).toHaveProperty('topLeaderboard');
      expect(body.data).toHaveProperty('rewardsSummary');
      expect(body.data).toHaveProperty('totals');
    });

    it('includes all snapshot totals fields in response', async () => {
      const snapshot = {
        empire: null,
        topLeaderboard: null,
        rewardsSummary: null,
        totals: {
          lifetimeDistributedUsd: 1500,
          lifetimeBurned: 300,
          distributionCount: 15,
          burnCount: 3,
        },
      };

      mockGetZabalSnapshot.mockResolvedValueOnce(snapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(body.data.totals).toEqual({
        lifetimeDistributedUsd: 1500,
        lifetimeBurned: 300,
        distributionCount: 15,
        burnCount: 3,
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockSession.fid = 123;
    });

    it('returns 502 when getZabalSnapshot throws Error', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockGetZabalSnapshot.mockRejectedValueOnce(new Error('API error'));

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.success).toBe(false);
      expect(body.error).toBe('snapshot_unavailable');
    });

    it('returns 502 when withCache throws', async () => {
      mockWithCache.mockRejectedValueOnce(new Error('Cache error'));

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('snapshot_unavailable');
    });

    it('handles non-Error thrown exceptions', async () => {
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockGetZabalSnapshot.mockRejectedValueOnce('raw string error');

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('snapshot_unavailable');
    });

    it('logs error message on failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockGetZabalSnapshot.mockRejectedValueOnce(new Error('Network timeout'));

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[empire-builder] snapshot error',
        'Network timeout',
      );

      consoleErrorSpy.mockRestore();
    });

    it('uses fallback error message for non-Error exceptions in logging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
      mockGetZabalSnapshot.mockRejectedValueOnce('unexpected string error');

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[empire-builder] snapshot error',
        'Empire Builder fetch failed',
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      mockSession.fid = 123;
      mockWithCache.mockImplementation(async (_key: string, _ttl: number, fetcher: () => unknown) =>
        fetcher(),
      );
    });

    it('handles full happy path with complete snapshot data', async () => {
      const snapshot = {
        empire: {
          id: 'zabal-empire',
          name: 'ZABAL Empire',
          symbol: 'ZABAL',
          market_cap: '10000000',
        },
        topLeaderboard: {
          id: 'leaderboard-1',
          entries: [
            { rank: 1, address: '0x111', score: 1000 },
            { rank: 2, address: '0x222', score: 900 },
          ],
        },
        rewardsSummary: {
          empire_rewards: [
            { amount_usd: '500', amount: '1000' },
            { amount_usd: '300', amount: '600' },
          ],
          burned: [{ amount: '200' }, { amount: '100' }],
        },
        totals: {
          lifetimeDistributedUsd: 800,
          lifetimeBurned: 300,
          distributionCount: 2,
          burnCount: 2,
        },
      };

      mockGetZabalSnapshot.mockResolvedValueOnce(snapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.empire.id).toBe('zabal-empire');
      expect(body.data.topLeaderboard.entries).toHaveLength(2);
      expect(body.data.totals.lifetimeDistributedUsd).toBe(800);
    });

    it('handles empty snapshot with null values', async () => {
      const snapshot = {
        empire: null,
        topLeaderboard: null,
        rewardsSummary: null,
        totals: {
          lifetimeDistributedUsd: 0,
          lifetimeBurned: 0,
          distributionCount: 0,
          burnCount: 0,
        },
      };

      mockGetZabalSnapshot.mockResolvedValueOnce(snapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.empire).toBeNull();
      expect(body.data.topLeaderboard).toBeNull();
      expect(body.data.rewardsSummary).toBeNull();
      expect(body.data.totals.lifetimeDistributedUsd).toBe(0);
    });

    it('handles partial snapshot data (some nulls, some data)', async () => {
      const snapshot = {
        empire: { id: 'zabal', name: 'ZABAL' },
        topLeaderboard: null,
        rewardsSummary: { empire_rewards: [], burned: [] },
        totals: {
          lifetimeDistributedUsd: 0,
          lifetimeBurned: 0,
          distributionCount: 0,
          burnCount: 0,
        },
      };

      mockGetZabalSnapshot.mockResolvedValueOnce(snapshot);

      const _req = makeGetRequest('/api/empire-builder/snapshot');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.empire).toBeTruthy();
      expect(body.data.topLeaderboard).toBeNull();
      expect(body.data.rewardsSummary).toBeTruthy();
    });
  });
});
