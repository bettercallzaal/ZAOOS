// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// createPublicClient is called at module level — mock before import
const mockMulticall = vi.hoisted(() => vi.fn());
const mockGetLogs = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockGetBlock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ timestamp: BigInt(1_700_000_000) }),
);
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      multicall: mockMulticall,
      getLogs: mockGetLogs,
      getBlock: mockGetBlock,
    })),
  };
});

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { fetchLeaderboard } from '../leaderboard';

// The module has a 5-min in-memory cache. Advance fake time by 10 min after each
// test so the next test always sees a stale cache and fetches fresh.
beforeAll(() => vi.useFakeTimers());
afterAll(() => vi.useRealTimers());
afterEach(() => {
  vi.clearAllMocks();
  vi.advanceTimersByTime(10 * 60 * 1000);
});

const MOCK_USERS = [
  {
    id: 'u-1',
    display_name: 'Zaal',
    ign: null,
    real_name: null,
    primary_wallet: '0xAAA0000000000000000000000000000000000001',
    respect_wallet: null,
    fid: 1,
    username: 'zabal',
    zid: 1,
  },
  {
    id: 'u-2',
    display_name: 'Arthur',
    ign: null,
    real_name: null,
    primary_wallet: '0xAAA0000000000000000000000000000000000002',
    respect_wallet: null,
    fid: 2,
    username: 'arthur',
    zid: 2,
  },
];

function makeMulticallResults(ogSupply: bigint, zorSupply: bigint, balances: [bigint, bigint][]) {
  const results = [
    { status: 'success', result: ogSupply },
    { status: 'success', result: zorSupply },
    ...balances.flatMap(([og, zor]) => [
      { status: 'success', result: og },
      { status: 'success', result: zor },
    ]),
  ];
  return results;
}

// ---------------------------------------------------------------------------
// fetchLeaderboard
// ---------------------------------------------------------------------------
describe('fetchLeaderboard', () => {
  it('returns empty leaderboard when no users have wallets', async () => {
    const noWalletUsers = MOCK_USERS.map((u) => ({ ...u, primary_wallet: null, respect_wallet: null }));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: noWalletUsers, error: null }),
      }),
    });
    const result = await fetchLeaderboard();
    expect(result.leaderboard).toHaveLength(0);
    expect(result.stats.totalMembers).toBe(0);
  });

  it('returns empty leaderboard when no active users', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const result = await fetchLeaderboard();
    expect(result.leaderboard).toHaveLength(0);
  });

  it('throws on DB error fetching users', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('DB fail') }),
      }),
    });
    await expect(fetchLeaderboard()).rejects.toThrow('DB fail');
  });

  it('returns ranked leaderboard sorted by totalRespect descending', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: MOCK_USERS, error: null }),
      }),
    });
    // Zaal: 10 OG (in wei), 5 ZOR; Arthur: 2 OG, 1 ZOR
    const ogSupply = BigInt('1000000000000000000'); // 1 ETH = 1 OG token
    const zorSupply = BigInt(100);
    mockMulticall.mockResolvedValue(
      makeMulticallResults(ogSupply, zorSupply, [
        [BigInt('10000000000000000000'), BigInt(5)], // Zaal: 10 OG, 5 ZOR
        [BigInt('2000000000000000000'), BigInt(1)],  // Arthur: 2 OG, 1 ZOR
      ]),
    );
    const result = await fetchLeaderboard();
    expect(result.leaderboard[0].name).toBe('Zaal');
    expect(result.leaderboard[0].rank).toBe(1);
    expect(result.leaderboard[1].name).toBe('Arthur');
    expect(result.leaderboard[1].rank).toBe(2);
    expect(result.stats.holdersWithRespect).toBe(2);
  });

  it('handles multicall failures gracefully (zero balance)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [MOCK_USERS[0]], error: null }),
      }),
    });
    mockMulticall.mockResolvedValue([
      { status: 'failure' },
      { status: 'failure' },
      { status: 'failure' },
      { status: 'failure' },
    ]);
    const result = await fetchLeaderboard();
    expect(result.leaderboard[0].ogRespect).toBe(0);
    expect(result.leaderboard[0].zorRespect).toBe(0);
  });

  it('excludes wallets with fid: prefix', async () => {
    const fidUser = { ...MOCK_USERS[0], primary_wallet: 'fid:123', respect_wallet: null };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [fidUser], error: null }),
      }),
    });
    const result = await fetchLeaderboard();
    expect(result.leaderboard).toHaveLength(0);
  });
});
