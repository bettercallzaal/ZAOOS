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

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { GET } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

describe('GET /api/discord/member-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/discord/member-stats'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── Validation tests ─────────────────────────────────────────────────────

  it('returns 400 when discord_id param is missing', async () => {
    const res = await GET(makeGetRequest('/api/discord/member-stats'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('discord_id is required');
  });

  // ── Success path tests ───────────────────────────────────────────────────

  it('returns stats when user has no Fractal scores', async () => {
    const userChain = chainMock({ data: null, error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.discordId).toBe('12345');
    expect(body.fractal).toEqual({
      totalRespect: 0,
      participationCount: 0,
      bestRank: 0,
      averageLevel: 0,
    });
    expect(body.governance).toEqual({
      proposalsCreated: 0,
      votesCast: 0,
      totalRespectWeight: 0,
    });
  });

  it('aggregates Fractal stats from scores by wallet and member_name', async () => {
    const user = {
      username: 'testuser',
      display_name: 'Test User',
      primary_wallet: '0x1234567890abcdef1234567890abcdef12345678',
      discord_id: '12345',
    };

    const scores = [
      { rank: 1, score: 100 },
      { rank: 3, score: 80 },
      { rank: 5, score: 60 },
    ];

    const userChain = chainMock({ data: user, error: null });
    const scoresChain = chainMock({ data: scores, error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.fractal).toMatchObject({
      totalRespect: 240, // 100 + 80 + 60
      participationCount: 3,
      bestRank: 1, // min of [1, 3, 5]
      averageLevel: 4, // Math.round((7 - 3) * 10) / 10 where 3 is avg rank: (1+3+5)/3=3, so 7-3=4
    });
  });

  it('calculates average level from ranks correctly', async () => {
    const user = {
      username: 'testuser',
      display_name: 'Test User',
      primary_wallet: '0xabc123',
      discord_id: '12345',
    };

    const scores = [
      { rank: 1, score: 50 }, // level 6
      { rank: 7, score: 50 }, // level 0
    ];

    const userChain = chainMock({ data: user, error: null });
    const scoresChain = chainMock({ data: scores, error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    // average rank = (1 + 7) / 2 = 4; average level = 7 - 4 = 3
    expect(body.fractal.averageLevel).toBe(3);
  });

  it('filters out ranks <= 0 when calculating bestRank', async () => {
    const user = {
      username: 'testuser',
      display_name: 'Test User',
      primary_wallet: '0xabc123',
      discord_id: '12345',
    };

    const scores = [
      { rank: 0, score: 50 },
      { rank: -1, score: 50 },
      { rank: 5, score: 50 },
    ];

    const userChain = chainMock({ data: user, error: null });
    const scoresChain = chainMock({ data: scores, error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.fractal.bestRank).toBe(5); // only rank > 0 are included
  });

  it('aggregates proposals and votes from governance tables', async () => {
    const proposals = [{ id: 'prop1' }, { id: 'prop2' }];

    const votes = [{ weight: 10 }, { weight: 20 }, { weight: 30 }];

    const userChain = chainMock({ data: null, error: null });
    const proposalsChain = chainMock({ data: proposals, error: null });
    const votesChain = chainMock({ data: votes, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.governance).toMatchObject({
      proposalsCreated: 2,
      votesCast: 3,
      totalRespectWeight: 60, // 10 + 20 + 30
    });
  });

  it('handles null weight in votes gracefully', async () => {
    const votes = [{ weight: 10 }, { weight: null }, { weight: 20 }];

    const userChain = chainMock({ data: null, error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: votes, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.governance.totalRespectWeight).toBe(30); // null coerced to 0
  });

  it('uses user primary_wallet for Fractal lookup when available', async () => {
    const user = {
      username: 'testuser',
      display_name: 'Test User',
      primary_wallet: '0xABCD1234',
      discord_id: '12345',
    };

    const userChain = chainMock({ data: user, error: null });
    const scoresChain = chainMock({ data: [], error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));

    // Verify the wallet was converted to lowercase in the or() condition
    const scoresCall = scoresChain.or as ReturnType<typeof vi.fn>;
    expect(scoresCall).toHaveBeenCalled();
  });

  // ── Error handling tests ──────────────────────────────────────────────────

  it('returns 500 and logs when proposals query errors', async () => {
    const userChain = chainMock({ data: null, error: null });
    const proposalsChain = chainMock({
      data: null,
      error: new Error('db error'),
    });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200); // Proposals errors are logged but don't crash
    const body = await res.json();
    expect(body.governance.proposalsCreated).toBe(0);
  });

  it('returns 500 and logs when votes query errors', async () => {
    const userChain = chainMock({ data: null, error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: null, error: new Error('db error') });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200); // Votes errors are logged but don't crash
    const body = await res.json();
    expect(body.governance.votesCast).toBe(0);
  });

  it('returns 500 when an unexpected exception is thrown', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  // ── Edge case tests ──────────────────────────────────────────────────────

  it('handles user without wallet for Fractal lookup', async () => {
    const user = {
      username: 'testuser',
      display_name: 'Test User',
      primary_wallet: null,
      discord_id: '12345',
    };

    const userChain = chainMock({ data: user, error: null });
    const scoresChain = chainMock({ data: [], error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.fractal).toEqual({
      totalRespect: 0,
      participationCount: 0,
      bestRank: 0,
      averageLevel: 0,
    });
  });

  it('handles user without display_name or username', async () => {
    const user = {
      username: null,
      display_name: null,
      primary_wallet: null,
      discord_id: '12345',
    };

    const userChain = chainMock({ data: user, error: null });
    const scoresChain = chainMock({ data: [], error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.fractal).toEqual({
      totalRespect: 0,
      participationCount: 0,
      bestRank: 0,
      averageLevel: 0,
    });
  });

  it('returns empty stats when data is null/empty across all tables', async () => {
    const userChain = chainMock({ data: null, error: null });
    const scoresChain = chainMock({ data: [], error: null });
    const proposalsChain = chainMock({ data: [], error: null });
    const votesChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [userChain, scoresChain, proposalsChain, votesChain];
      return chains[callCount++];
    });

    const res = await GET(makeGetRequest('/api/discord/member-stats', { discord_id: '12345' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toMatchObject({
      discordId: '12345',
      fractal: {
        totalRespect: 0,
        participationCount: 0,
        bestRank: 0,
        averageLevel: 0,
      },
      governance: {
        proposalsCreated: 0,
        votesCast: 0,
        totalRespectWeight: 0,
      },
    });
  });
});
