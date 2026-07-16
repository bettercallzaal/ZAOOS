import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
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
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = [
    'select',
    'order',
    'eq',
    'gt',
    'gte',
    'lt',
    'lte',
    'limit',
    'in',
    'neq',
    'like',
    'ilike',
    'not',
  ];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

describe('GET /api/fractals/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session exists but is null-like', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── Success path tests ────────────────────────────────────────────────────

  it('returns complete analytics structure on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const members = [
      {
        name: 'Alice',
        wallet_address: '0x1111',
        total_respect: 100,
        fractal_respect: 50,
        onchain_og: 10,
        onchain_zor: 5,
        event_respect: 20,
        hosting_respect: 15,
        bonus_respect: 5,
        first_respect_at: '2026-01-01',
        fractal_count: 5,
      },
      {
        name: 'Bob',
        wallet_address: '0x2222',
        total_respect: 200,
        fractal_respect: 100,
        onchain_og: 20,
        onchain_zor: 10,
        event_respect: 40,
        hosting_respect: 30,
        bonus_respect: 10,
        first_respect_at: '2026-01-02',
        fractal_count: 10,
      },
    ];

    const sessions = [
      {
        id: 'sess1',
        name: 'Session 1',
        session_date: '2026-01-01',
        scoring_era: 'OG',
        participant_count: 10,
        notes: 'synced from Airtable',
        created_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 'sess2',
        name: 'Session 2',
        session_date: '2026-01-02',
        scoring_era: 'ORDAO',
        participant_count: 15,
        notes: '',
        created_at: '2026-01-02T10:00:00Z',
      },
    ];

    const scores = [
      { score: 100, rank: 1, wallet_address: '0x1111' },
      { score: 90, rank: 2, wallet_address: '0x2222' },
      { score: 80, rank: 3, wallet_address: '0x1111' },
    ];

    const topByFractal = [
      {
        name: 'Alice',
        wallet_address: '0x1111',
        fractal_respect: 50,
        fractal_count: 5,
      },
    ];

    const recentSessions = [
      {
        id: 'sess2',
        name: 'Session 2',
        session_date: '2026-01-02',
        scoring_era: 'ORDAO',
        participant_count: 15,
        notes: '',
        fractal_scores: [
          {
            member_name: 'Bob',
            wallet_address: '0x2222',
            rank: 2,
            score: 90,
          },
        ],
      },
    ];

    const mockChains = [
      chainMock({ data: members }),
      chainMock({ data: sessions }),
      chainMock({ data: scores }),
      chainMock({ data: topByFractal }),
      chainMock({ data: recentSessions }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Verify response structure
    expect(body).toHaveProperty('overview');
    expect(body).toHaveProperty('participationTimeline');
    expect(body).toHaveProperty('scoreDistribution');
    expect(body).toHaveProperty('respectCurve');
    expect(body).toHaveProperty('topByFractal');
    expect(body).toHaveProperty('topHosters');
    expect(body).toHaveProperty('recentSessions');

    // Verify overview aggregation
    expect(body.overview.totalRespect).toBe(300);
    expect(body.overview.totalFractalRespect).toBe(150);
    expect(body.overview.totalOGOnchain).toBe(30);
    expect(body.overview.totalZOROnchain).toBe(15);
    expect(body.overview.totalSessions).toBe(2);
    expect(body.overview.totalParticipations).toBe(3);
    expect(body.overview.uniqueParticipants).toBe(2);
    expect(body.overview.membersWithRespect).toBe(2);
    expect(body.overview.totalMembers).toBe(2);
    expect(body.overview.ogSessions).toBe(1);
    expect(body.overview.ordaoSessions).toBe(1);

    // Verify participation timeline
    expect(body.participationTimeline).toHaveLength(2);
    expect(body.participationTimeline[0]).toEqual({
      name: 'Session 1',
      date: '2026-01-01',
      era: 'OG',
      participants: 10,
    });

    // Verify score distribution
    expect(body.scoreDistribution['100']).toBe(1);
    expect(body.scoreDistribution['90']).toBe(1);
    expect(body.scoreDistribution['80']).toBe(1);

    // Verify respect curve
    expect(body.respectCurve).toHaveLength(2);
    expect(body.respectCurve[0].name).toBe('Alice');
    expect(body.respectCurve[0].total).toBe(100);
    expect(body.respectCurve[0].fractal).toBe(50);
    expect(body.respectCurve[0].sessions).toBe(5);

    // Verify top by fractal
    expect(body.topByFractal).toEqual(topByFractal);

    // Verify top hosters
    expect(body.topHosters).toHaveLength(2);
    expect(body.topHosters[0].name).toBe('Bob');
    expect(body.topHosters[0].value).toBe(30);

    // Verify recent sessions
    expect(body.recentSessions).toEqual(recentSessions);
  });

  it('returns empty collections when no data exists', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.overview.totalRespect).toBe(0);
    expect(body.overview.totalSessions).toBe(0);
    expect(body.overview.totalParticipations).toBe(0);
    expect(body.participationTimeline).toEqual([]);
    expect(body.scoreDistribution).toEqual({});
    expect(body.respectCurve).toEqual([]);
    expect(body.topByFractal).toEqual([]);
    expect(body.topHosters).toEqual([]);
    expect(body.recentSessions).toEqual([]);
  });

  it('filters members with zero respect from respectCurve and topHosters', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const members = [
      {
        name: 'Alice',
        wallet_address: '0x1111',
        total_respect: 100,
        fractal_respect: 50,
        onchain_og: 0,
        onchain_zor: 0,
        event_respect: 0,
        hosting_respect: 10,
        bonus_respect: 0,
        first_respect_at: '2026-01-01',
        fractal_count: 5,
      },
      {
        name: 'Bob',
        wallet_address: '0x2222',
        total_respect: 0,
        fractal_respect: 0,
        onchain_og: 0,
        onchain_zor: 0,
        event_respect: 0,
        hosting_respect: 0,
        bonus_respect: 0,
        first_respect_at: null,
        fractal_count: 0,
      },
    ];

    const mockChains = [
      chainMock({ data: members }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Only Alice should appear (has > 0 total_respect)
    expect(body.respectCurve).toHaveLength(1);
    expect(body.respectCurve[0].name).toBe('Alice');

    // Only Alice should appear (has > 0 hosting_respect)
    expect(body.topHosters).toHaveLength(1);
    expect(body.topHosters[0].name).toBe('Alice');
  });

  it('correctly identifies OG vs ORDAO sessions', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const sessions = [
      {
        id: 'og1',
        name: 'OG Session 1',
        session_date: '2026-01-01',
        scoring_era: 'OG',
        participant_count: 10,
        notes: 'synced from Airtable',
        created_at: '2026-01-01T10:00:00Z',
      },
      {
        id: 'og2',
        name: 'OG Session 2',
        session_date: '2026-01-02',
        scoring_era: 'OG',
        participant_count: 12,
        notes: 'imported from Airtable, synced from Airtable',
        created_at: '2026-01-02T10:00:00Z',
      },
      {
        id: 'ordao1',
        name: 'ORDAO Session 1',
        session_date: '2026-01-03',
        scoring_era: 'ORDAO',
        participant_count: 15,
        notes: 'webhook event',
        created_at: '2026-01-03T10:00:00Z',
      },
      {
        id: 'ordao2',
        name: 'ORDAO Session 2',
        session_date: '2026-01-04',
        scoring_era: 'ORDAO',
        participant_count: 20,
        notes: null,
        created_at: '2026-01-04T10:00:00Z',
      },
    ];

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: sessions }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.overview.totalSessions).toBe(4);
    expect(body.overview.ogSessions).toBe(2);
    expect(body.overview.ordaoSessions).toBe(2);
  });

  it('handles members with null fractal_count gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const members = [
      {
        name: 'Alice',
        wallet_address: '0x1111',
        total_respect: 100,
        fractal_respect: 50,
        onchain_og: 10,
        onchain_zor: 5,
        event_respect: 20,
        hosting_respect: 15,
        bonus_respect: 5,
        first_respect_at: '2026-01-01',
        fractal_count: null,
      },
    ];

    const mockChains = [
      chainMock({ data: members }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // fractal_count should default to 0
    expect(body.respectCurve[0].sessions).toBe(0);
  });

  it('correctly counts unique participants by wallet address', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const scores = [
      { score: 100, rank: 1, wallet_address: '0x1111' },
      { score: 90, rank: 2, wallet_address: '0x2222' },
      { score: 80, rank: 3, wallet_address: '0x1111' }, // duplicate wallet
      { score: 70, rank: 4, wallet_address: null }, // null address filtered out
    ];

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: scores }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.overview.totalParticipations).toBe(4);
    expect(body.overview.uniqueParticipants).toBe(2); // 0x1111 and 0x2222 only
  });

  it('builds correct score distribution histogram', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const scores = [
      { score: 100, rank: 1, wallet_address: '0x1111' },
      { score: 100, rank: 2, wallet_address: '0x2222' },
      { score: 90, rank: 3, wallet_address: '0x3333' },
      { score: 90, rank: 4, wallet_address: '0x4444' },
      { score: 90, rank: 5, wallet_address: '0x5555' },
      { score: 50, rank: 6, wallet_address: '0x6666' },
    ];

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: scores }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.scoreDistribution['100']).toBe(2);
    expect(body.scoreDistribution['90']).toBe(3);
    expect(body.scoreDistribution['50']).toBe(1);
  });

  it('sorts topHosters by hosting_respect descending (top 10)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const members = Array.from({ length: 15 }, (_, i) => ({
      name: `Member ${i}`,
      wallet_address: `0x${i}`,
      total_respect: 1000,
      fractal_respect: 100,
      onchain_og: 0,
      onchain_zor: 0,
      event_respect: 0,
      hosting_respect: 1000 - i * 50, // descending from 1000 to 250
      bonus_respect: 0,
      first_respect_at: '2026-01-01',
      fractal_count: 5,
    }));

    const mockChains = [
      chainMock({ data: members }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.topHosters).toHaveLength(10);
    expect(body.topHosters[0].name).toBe('Member 0');
    expect(body.topHosters[0].value).toBe(1000);
    expect(body.topHosters[9].name).toBe('Member 9');
    expect(body.topHosters[9].value).toBe(550);
  });

  it('handles numeric string respect values correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const members = [
      {
        name: 'Alice',
        wallet_address: '0x1111',
        total_respect: '100', // string instead of number
        fractal_respect: '50',
        onchain_og: '10',
        onchain_zor: '5',
        event_respect: '20',
        hosting_respect: '15',
        bonus_respect: '5',
        first_respect_at: '2026-01-01',
        fractal_count: 5,
      },
    ];

    const mockChains = [
      chainMock({ data: members }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should coerce strings to numbers correctly
    expect(body.overview.totalRespect).toBe(100);
    expect(body.overview.totalFractalRespect).toBe(50);
    expect(body.respectCurve[0].total).toBe(100);
    expect(body.respectCurve[0].fractal).toBe(50);
  });

  // ── Error path tests ──────────────────────────────────────────────────────

  it('returns 200 even when individual query results have error fields (route ignores them)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    // The route only checks .data (via ?? []), not .error—so a result with data: null, error: true still succeeds
    const mockChains = [
      chainMock({ data: null, error: new Error('db error') }), // error field ignored, data coerced to []
      chainMock({ data: null, error: new Error('db error') }),
      chainMock({ data: null, error: new Error('db error') }),
      chainMock({ data: null, error: new Error('db error') }),
      chainMock({ data: null, error: new Error('db error') }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200); // no exception, so 200
    const body = await res.json();
    expect(body.overview.totalRespect).toBe(0); // all data coerced to []
  });

  it('returns 500 when an unexpected exception is thrown', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error during query');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load analytics');
  });

  it('calls correct supabase tables for all five queries', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation((_table) => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    await GET();

    expect(mockFrom).toHaveBeenCalledTimes(5);
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'respect_members');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'fractal_sessions');
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'fractal_scores');
    expect(mockFrom).toHaveBeenNthCalledWith(4, 'respect_members');
    expect(mockFrom).toHaveBeenNthCalledWith(5, 'fractal_sessions');
  });

  // ── Edge case tests ──────────────────────────────────────────────────────

  it('handles deeply nested nested relations in recentSessions', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const recentSessions = [
      {
        id: 'sess1',
        name: 'Session 1',
        session_date: '2026-01-01',
        scoring_era: 'OG',
        participant_count: 5,
        notes: 'test',
        fractal_scores: [
          {
            member_name: 'Alice',
            wallet_address: '0x1111',
            rank: 1,
            score: 100,
          },
          {
            member_name: 'Bob',
            wallet_address: '0x2222',
            rank: 2,
            score: 90,
          },
        ],
      },
    ];

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: recentSessions }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.recentSessions).toHaveLength(1);
    expect(body.recentSessions[0].fractal_scores).toHaveLength(2);
    expect(body.recentSessions[0].fractal_scores[0].member_name).toBe('Alice');
  });

  it('only returns topByFractal limited to 20 entries from query', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const topByFractal = Array.from({ length: 25 }, (_, i) => ({
      name: `Member ${i}`,
      wallet_address: `0x${i}`,
      fractal_respect: 100 - i,
      fractal_count: i,
    }));

    // The query includes .limit(20), so only 20 come back from DB
    const limitedTopByFractal = topByFractal.slice(0, 20);

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: limitedTopByFractal }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.topByFractal).toHaveLength(20);
  });

  it('only returns recentSessions limited to 10 entries from query', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const recentSessions = Array.from({ length: 15 }, (_, i) => ({
      id: `sess${i}`,
      name: `Session ${i}`,
      session_date: '2026-01-01',
      scoring_era: 'OG',
      participant_count: i,
      notes: '',
      fractal_scores: [],
    }));

    // The query includes .limit(10), so only 10 come back from DB
    const limitedRecentSessions = recentSessions.slice(0, 10);

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: limitedRecentSessions }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.recentSessions).toHaveLength(10);
  });

  it('handles score distribution with string keys correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const scores = [
      { score: 100, rank: 1, wallet_address: '0x1111' },
      { score: '90', rank: 2, wallet_address: '0x2222' }, // string score
      { score: 100, rank: 3, wallet_address: '0x3333' },
    ];

    const mockChains = [
      chainMock({ data: [] }),
      chainMock({ data: [] }),
      chainMock({ data: scores }),
      chainMock({ data: [] }),
      chainMock({ data: [] }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chain = mockChains[callIndex];
      callIndex += 1;
      return chain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should normalize string scores to numbers for histogram
    expect(body.scoreDistribution['100']).toBe(2);
    expect(body.scoreDistribution['90']).toBe(1);
  });
});
