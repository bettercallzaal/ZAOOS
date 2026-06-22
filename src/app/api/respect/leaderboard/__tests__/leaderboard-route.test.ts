import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockFrom, mockFetchLb } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockFetchLb: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/respect/leaderboard', () => ({ fetchLeaderboard: () => mockFetchLb() }));

import { GET } from '@/app/api/respect/leaderboard/route';

/** respect_members chain: select returns chain, order resolves { data }. */
function membersChain(data: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue({ data });
  return chain;
}

const member = (over: Record<string, unknown>) => ({
  name: 'X', wallet_address: '0x0', fid: 1, username: 'x', zid: null,
  total_respect: 0, onchain_og: 0, onchain_zor: 0, fractal_respect: 0, fractal_count: 0,
  first_respect_at: null, event_respect: 0, hosting_respect: 0, bonus_respect: 0, hosting_count: 0,
  ...over,
});

describe('GET /api/respect/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ fid: 1, walletAddress: '0xme' });
  });

  it('401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it('assigns ranks in order and computes OG supply percentages', async () => {
    mockFrom.mockReturnValue(
      membersChain([
        member({ name: 'Top', total_respect: 100, onchain_og: 30 }),
        member({ name: 'Second', total_respect: 50, onchain_og: 70 }),
      ]),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const { leaderboard, stats } = await res.json();
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].name).toBe('Top');
    expect(leaderboard[1].rank).toBe(2);
    // og supply = 30 + 70 = 100 -> percentages
    expect(leaderboard[0].ogPct).toBe(30);
    expect(leaderboard[1].ogPct).toBe(70);
    expect(stats.totalMembers).toBe(2);
    expect(stats.totalOG).toBe(100);
    expect(stats.totalRespect).toBe(150);
  });

  it('counts only holders with respect > 0', async () => {
    mockFrom.mockReturnValue(
      membersChain([
        member({ total_respect: 10 }),
        member({ total_respect: 0 }),
      ]),
    );
    const { stats } = await (await GET()).json();
    expect(stats.holdersWithRespect).toBe(1);
  });
});
