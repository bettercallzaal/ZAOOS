import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockGetSession, mockWithCache, mockDiscoverLeaderboards, mockGetLeaderboardForAddress } =
  vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockWithCache: vi.fn(),
    mockDiscoverLeaderboards: vi.fn(),
    mockGetLeaderboardForAddress: vi.fn(),
  }));

vi.mock('@/lib/auth/session', () => ({
  getSession: mockGetSession,
}));

vi.mock('@/lib/empire-builder/cache', () => ({
  withCache: mockWithCache,
  DEFAULT_TTL_MS: 60000,
}));

vi.mock('@/lib/empire-builder/client', () => ({
  discoverLeaderboards: mockDiscoverLeaderboards,
  getLeaderboardForAddress: mockGetLeaderboardForAddress,
}));

vi.mock('@/lib/empire-builder/config', () => ({
  ZABAL_TOKEN_ADDRESS: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
}));

import { GET } from '../route';

describe('GET /api/empire-builder/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Auth tests
  // ========================================================================

  it('returns 401 when session has no fid', async () => {
    mockGetSession.mockResolvedValue({ fid: undefined, walletAddress: '0xabc' });

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'unauthorized' });
  });

  it('returns 502 when session is null (cannot read fid)', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'me_unavailable' });
  });

  // ========================================================================
  // Query validation tests
  // ========================================================================

  it('accepts query params and does not 400 on valid strings', async () => {
    mockGetSession.mockResolvedValue({ fid: 123 });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const req = makeGetRequest('/api/empire-builder/me', {
      wallet: '0xvalid',
      slot: '0', // Optional string — schema allows
    });

    const res = await GET(req);
    // The schema is minimal: just { wallet?: string, slot?: string }
    // so these valid params will parse and return 200.
    expect(res.status).toBe(200);
  });

  // ========================================================================
  // No wallet tests (neither query nor session)
  // ========================================================================

  it('returns 200 with null wallet when neither query wallet nor session wallet provided', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: undefined });

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      data: { wallet: null, entry: null, boosters: [] },
    });
  });

  it('returns 200 with null wallet when both query and session wallet are empty strings', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '' });

    const res = await GET(makeGetRequest('/api/empire-builder/me', { wallet: '  ' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      data: { wallet: null, entry: null, boosters: [] },
    });
  });

  // ========================================================================
  // Query wallet precedence tests
  // ========================================================================

  it('prefers query wallet over session wallet', async () => {
    mockGetSession.mockResolvedValue({
      fid: 123,
      walletAddress: '0xsession_wallet',
    });

    const queryWallet = '0xquery_wallet';
    const slotId = 'slot-1';
    const mockSlot = { id: slotId, name: 'Slot 1' };
    const mockStats = {
      entry: { rank: 1, score: 1000 },
      boosters: [{ id: 'b1', name: 'Booster 1' }],
    };

    // Mock withCache to call the fetcher and return the result
    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me', { wallet: queryWallet }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.wallet).toBe(queryWallet);
  });

  it('uses session wallet when query wallet not provided', async () => {
    const sessionWallet = '0xsession_wallet';
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: sessionWallet });

    const slotId = 'slot-1';
    const mockSlot = { id: slotId, name: 'Slot 1' };
    const mockStats = {
      entry: { rank: 1, score: 1000 },
      boosters: [],
    };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.wallet).toBe(sessionWallet);
  });

  // ========================================================================
  // Leaderboard discovery and slot selection tests
  // ========================================================================

  it('returns 200 with entry null when no leaderboards exist', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([]);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      data: { wallet: '0xwallet', entry: null, boosters: [] },
    });
  });

  it('uses slot index 0 by default', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 5 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot, { id: 'slot-1', name: 'Slot 1' }]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.slot.id).toBe('slot-0');
  });

  it('uses query slot parameter when provided and valid', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-2', name: 'Slot 2' };
    const mockStats = { entry: { rank: 3 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([
      { id: 'slot-0', name: 'Slot 0' },
      { id: 'slot-1', name: 'Slot 1' },
      mockSlot,
    ]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me', { slot: '2' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.slot.id).toBe('slot-2');
  });

  it('falls back to slot 0 when query slot is out of bounds', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me', { slot: '999' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.slot.id).toBe('slot-0');
  });

  it('falls back to slot 0 when query slot is not a finite number', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me', { slot: 'abc' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.slot.id).toBe('slot-0');
  });

  // ========================================================================
  // Cache integration tests
  // ========================================================================

  it('calls withCache for leaderboards discovery', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    await GET(makeGetRequest('/api/empire-builder/me'));

    expect(mockWithCache).toHaveBeenCalledWith(
      'eb:slots:0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('calls withCache for address stats', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    await GET(makeGetRequest('/api/empire-builder/me'));

    expect(mockWithCache).toHaveBeenCalledWith(
      expect.stringContaining('eb:me:slot-0:'),
      expect.any(Number),
      expect.any(Function),
    );
  });

  // ========================================================================
  // Full success path tests
  // ========================================================================

  it('returns 200 with full stats on success', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = {
      entry: { rank: 1, score: 5000 },
      boosters: [
        { id: 'b1', name: 'Booster 1', level: 2 },
        { id: 'b2', name: 'Booster 2', level: 1 },
      ],
    };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      wallet: '0xwallet',
      slot: mockSlot,
      entry: mockStats.entry,
      boosters: mockStats.boosters,
    });
  });

  it('returns 200 with empty boosters array when stats.boosters is undefined', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = {
      entry: { rank: 1 },
      boosters: undefined, // Explicitly undefined
    };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(
      mockStats as unknown as {
        entry: { rank: number };
        boosters?: unknown[];
      },
    );

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.boosters).toEqual([]);
  });

  it('returns 200 with entry null when getLeaderboardForAddress returns null', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(null);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      data: { wallet: '0xwallet', entry: null, boosters: [], slot: mockSlot },
    });
  });

  // ========================================================================
  // Error handling tests
  // ========================================================================

  it('returns 502 when getSession throws an error', async () => {
    mockGetSession.mockRejectedValue(new Error('Session error'));

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'me_unavailable' });
  });

  it('returns 502 when discoverLeaderboards throws an error', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockRejectedValue(new Error('Leaderboards API error'));

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'me_unavailable' });
  });

  it('returns 502 when getLeaderboardForAddress throws an error', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockRejectedValue(new Error('Address stats API error'));

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'me_unavailable' });
  });

  it('logs error message when an unknown error is thrown', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockRejectedValue(new Error('Custom error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await GET(makeGetRequest('/api/empire-builder/me'));

    expect(consoleSpy).toHaveBeenCalledWith('[empire-builder] me error', expect.any(String));

    consoleSpy.mockRestore();
  });

  it('handles non-Error thrown values gracefully', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockRejectedValue('String error');

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: 'me_unavailable',
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  it('handles wallet address with leading/trailing whitespace', async () => {
    mockGetSession.mockResolvedValue({
      fid: 123,
      walletAddress: '  0xwallet  ',
    });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.wallet).toBe('0xwallet');
  });

  it('converts wallet address to lowercase when calling getLeaderboardForAddress', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xABCDEF' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    await GET(makeGetRequest('/api/empire-builder/me'));

    // The cache key includes the lowercase address
    expect(mockWithCache).toHaveBeenCalledWith(
      expect.stringContaining('0xabcdef'),
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('uses negative slot index to fall back to slot 0', async () => {
    mockGetSession.mockResolvedValue({ fid: 123, walletAddress: '0xwallet' });

    const mockSlot = { id: 'slot-0', name: 'Slot 0' };
    const mockStats = { entry: { rank: 1 }, boosters: [] };

    mockWithCache.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
        return fetcher();
      },
    );

    mockDiscoverLeaderboards.mockResolvedValue([mockSlot]);
    mockGetLeaderboardForAddress.mockResolvedValue(mockStats);

    const res = await GET(makeGetRequest('/api/empire-builder/me', { slot: '-1' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.slot.id).toBe('slot-0');
  });
});
