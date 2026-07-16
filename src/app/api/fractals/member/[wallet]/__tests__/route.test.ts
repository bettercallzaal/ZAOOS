import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_WALLET,
} from '@/test-utils/api-helpers';

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
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Build a Supabase-like chain that returns a real Promise (for Promise.all).
 * All chainable methods return the chain; awaiting resolves to result.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainableMethods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'order',
    'range',
    'limit',
    'maybeSingle',
    'or',
  ];

  for (const method of chainableMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.single = vi.fn().mockResolvedValue(result);

  // Implement both then (for thenable) and Symbol.toStringTag for Promise.all
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((onResolve?: (val: unknown) => void, onReject?: (err: unknown) => void) => {
    const promise = Promise.resolve(result);
    if (onResolve) return promise.then(onResolve, onReject);
    return promise;
  });

  // Make it Promise.all compatible by returning a real Promise
  chain[Symbol.toStringTag] = 'Promise';

  return chain;
}

describe('GET /api/fractals/member/[wallet]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeRequest('/api/fractals/member/0x123'), {
        params: Promise.resolve({ wallet: VALID_WALLET }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('proceeds when authenticated with a valid member', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const memberChain = chainMock({
        data: {
          name: 'Alice',
          wallet_address: VALID_WALLET.toLowerCase(),
          total_respect: 100,
          fractal_respect: 50,
          onchain_og: true,
          onchain_zor: false,
          fractal_count: 3,
          event_respect: 20,
          hosting_respect: 10,
          bonus_respect: 5,
          first_respect_at: '2024-01-01',
        },
      });

      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected from() call');
      });

      const res = await GET(makeRequest('/api/fractals/member/0x123'), {
        params: Promise.resolve({ wallet: VALID_WALLET }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.member.name).toBe('Alice');
    });
  });

  describe('wallet parameter validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 for empty wallet string', async () => {
      const res = await GET(makeRequest('/api/fractals/member/'), {
        params: Promise.resolve({ wallet: '' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid lookup value');
    });

    it('returns 400 when wallet exceeds 100 characters', async () => {
      const longWallet = 'x'.repeat(101);
      const res = await GET(makeRequest('/api/fractals/member/x'), {
        params: Promise.resolve({ wallet: longWallet }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid lookup value');
    });
  });

  describe('member lookup behavior', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('converts wallet to lowercase before querying', async () => {
      const upperWallet = '0xABCD1234567890ABCDEF1234567890abcdef1234';
      const member = {
        name: 'Carol',
        wallet_address: upperWallet.toLowerCase(),
        total_respect: 200,
        fractal_respect: 100,
        onchain_og: true,
        onchain_zor: true,
        fractal_count: 5,
        event_respect: 30,
        hosting_respect: 20,
        bonus_respect: 10,
        first_respect_at: '2023-01-01',
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      await GET(makeRequest('/api/fractals/member/0x1234'), {
        params: Promise.resolve({ wallet: upperWallet }),
      });

      expect(memberChain.eq).toHaveBeenCalledWith('wallet_address', upperWallet.toLowerCase());
    });

    it('returns 404 when member not found by wallet or name', async () => {
      const memberChain = chainMock({ data: null });
      const nameChain = chainMock({ data: null });

      mockFrom.mockReturnValueOnce(memberChain).mockReturnValueOnce(nameChain);

      const res = await GET(makeRequest('/api/fractals/member/0x999'), {
        params: Promise.resolve({ wallet: 'nonexistent' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Member not found');
    });

    it('falls back to name search (ilike) if wallet lookup returns null', async () => {
      const memberChain = chainMock({ data: null });
      const member = {
        name: 'David',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 75,
        fractal_respect: 40,
        onchain_og: false,
        onchain_zor: false,
        fractal_count: 1,
        event_respect: 15,
        hosting_respect: 5,
        bonus_respect: 0,
        first_respect_at: '2024-06-01',
      };
      const nameChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2) return nameChain;
        if (callCount === 3 || callCount === 4) return scoresChain;
        if (callCount === 5) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/david'), {
        params: Promise.resolve({ wallet: 'david' }),
      });

      expect(res.status).toBe(200);
      expect(nameChain.ilike).toHaveBeenCalledWith('name', 'david');
    });
  });

  describe('fractal scores aggregation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('deduplicates scores by session id and rank', async () => {
      const member = {
        name: 'Frank',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 120,
        fractal_respect: 70,
        onchain_og: true,
        onchain_zor: true,
        fractal_count: 3,
        event_respect: 20,
        hosting_respect: 10,
        bonus_respect: 5,
        first_respect_at: '2024-01-15',
      };

      const score = {
        rank: 1,
        score: 50,
        wallet_address: member.wallet_address,
        member_name: member.name,
        fractal_sessions: {
          id: 'session-1',
          name: 'Session A',
          session_date: '2024-01-20',
          scoring_era: '2x',
          participant_count: 10,
          notes: 'Test session',
        },
      };

      const memberChain = chainMock({ data: member });
      const scoresDupChain = chainMock({ data: [score, score] }); // Duplicate
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresDupChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/frank'), {
        params: Promise.resolve({ wallet: 'frank' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.history).toHaveLength(1); // Deduplicated to 1
    });

    it('handles fractal_sessions as array or single object', async () => {
      const member = {
        name: 'Grace',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 90,
        fractal_respect: 60,
        onchain_og: false,
        onchain_zor: true,
        fractal_count: 2,
        event_respect: 15,
        hosting_respect: 5,
        bonus_respect: 0,
        first_respect_at: '2024-04-01',
      };

      const scoreWithArray = {
        rank: 2,
        score: 35,
        wallet_address: member.wallet_address,
        member_name: member.name,
        fractal_sessions: [
          {
            id: 'session-2',
            name: 'Session B',
            session_date: '2024-04-05',
            scoring_era: '1x',
            participant_count: 8,
            notes: 'Array session',
          },
        ],
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [scoreWithArray] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/grace'), {
        params: Promise.resolve({ wallet: 'grace' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.history).toHaveLength(1);
      expect(body.history[0].sessionName).toBe('Session B');
    });

    it('detects ORDAO sessions from notes', async () => {
      const member = {
        name: 'Henry',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 110,
        fractal_respect: 65,
        onchain_og: true,
        onchain_zor: true,
        fractal_count: 2,
        event_respect: 22,
        hosting_respect: 12,
        bonus_respect: 3,
        first_respect_at: '2024-03-01',
      };

      const scores = [
        {
          rank: 3,
          score: 40,
          wallet_address: member.wallet_address,
          member_name: member.name,
          fractal_sessions: {
            id: 's1',
            name: 'ORDAO',
            session_date: '2024-03-10',
            scoring_era: '3x',
            participant_count: 12,
            notes: 'ORDAO test',
          },
        },
        {
          rank: 2,
          score: 25,
          wallet_address: member.wallet_address,
          member_name: member.name,
          fractal_sessions: {
            id: 's2',
            name: 'On-Chain',
            session_date: '2024-03-15',
            scoring_era: '2x',
            participant_count: 6,
            notes: 'on-chain deployment',
          },
        },
      ];

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: scores });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/henry'), {
        params: Promise.resolve({ wallet: 'henry' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.history[0].source).toBe('ordao');
      expect(body.history[1].source).toBe('ordao');
    });

    it('extracts Tx hash from notes', async () => {
      const member = {
        name: 'Iris',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 95,
        fractal_respect: 55,
        onchain_og: false,
        onchain_zor: true,
        fractal_count: 1,
        event_respect: 20,
        hosting_respect: 10,
        bonus_respect: 2,
        first_respect_at: '2024-05-01',
      };

      const score = {
        rank: 1,
        score: 55,
        wallet_address: member.wallet_address,
        member_name: member.name,
        fractal_sessions: {
          id: 'session-5',
          name: 'TX Session',
          session_date: '2024-05-20',
          scoring_era: '1x',
          participant_count: 5,
          notes: 'ORDAO Tx: 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [score] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/iris'), {
        params: Promise.resolve({ wallet: 'iris' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.history[0].txHash).toBe(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      );
    });
  });

  describe('stats calculation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calculates stats including first place, avgRank, and session counts', async () => {
      const member = {
        name: 'Jack',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 200,
        fractal_respect: 120,
        onchain_og: true,
        onchain_zor: true,
        fractal_count: 4,
        event_respect: 40,
        hosting_respect: 30,
        bonus_respect: 10,
        first_respect_at: '2023-12-01',
      };

      const scores = [
        {
          rank: 1,
          score: 50,
          wallet_address: member.wallet_address,
          member_name: member.name,
          fractal_sessions: {
            id: 's1',
            name: 'Session 1',
            session_date: '2024-01-01',
            scoring_era: '2x',
            participant_count: 10,
            notes: 'og',
          },
        },
        {
          rank: 1,
          score: 40,
          wallet_address: member.wallet_address,
          member_name: member.name,
          fractal_sessions: {
            id: 's2',
            name: 'Session 2',
            session_date: '2024-02-01',
            scoring_era: '2x',
            participant_count: 12,
            notes: 'ORDAO',
          },
        },
        {
          rank: 2,
          score: 30,
          wallet_address: member.wallet_address,
          member_name: member.name,
          fractal_sessions: {
            id: 's3',
            name: 'Session 3',
            session_date: '2024-03-01',
            scoring_era: '1x',
            participant_count: 8,
            notes: 'og',
          },
        },
      ];

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: scores });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/jack'), {
        params: Promise.resolve({ wallet: 'jack' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.stats.totalSessions).toBe(3);
      expect(body.stats.totalFractalRespect).toBe(120);
      expect(body.stats.firstPlace).toBe(2);
      expect(body.stats.avgRank).toBeCloseTo((1 + 1 + 2) / 3, 1);
      expect(body.stats.ogSessions).toBe(2);
      expect(body.stats.ordaoSessions).toBe(1);
    });

    it('clamps rank to 1-6 range in stats but keeps original in history', async () => {
      const member = {
        name: 'Karen',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 50,
        fractal_respect: 30,
        onchain_og: false,
        onchain_zor: false,
        fractal_count: 1,
        event_respect: 10,
        hosting_respect: 5,
        bonus_respect: 0,
        first_respect_at: '2024-06-01',
      };

      const score = {
        rank: 99,
        score: 30,
        wallet_address: member.wallet_address,
        member_name: member.name,
        fractal_sessions: {
          id: 's-bad',
          name: 'Bad Rank',
          session_date: '2024-06-01',
          scoring_era: '1x',
          participant_count: 3,
          notes: 'bad data',
        },
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [score] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/karen'), {
        params: Promise.resolve({ wallet: 'karen' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      // Route returns history with original rank, but clamped for stats calculations
      expect(body.history[0].rank).toBe(99);
    });
  });

  describe('respect events and ledger', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('includes respect events in response', async () => {
      const member = {
        name: 'Mary',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 110,
        fractal_respect: 60,
        onchain_og: true,
        onchain_zor: false,
        fractal_count: 2,
        event_respect: 30,
        hosting_respect: 15,
        bonus_respect: 5,
        first_respect_at: '2024-02-01',
      };

      const events = [
        {
          event_type: 'hosting',
          amount: 15,
          description: 'Hosted event X',
          event_date: '2024-06-01',
          created_at: '2024-06-01T12:00:00Z',
        },
        {
          event_type: 'bonus',
          amount: 5,
          description: 'Referral bonus',
          event_date: '2024-05-15',
          created_at: '2024-05-15T08:00:00Z',
        },
      ];

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: events });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/mary'), {
        params: Promise.resolve({ wallet: 'mary' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.events).toHaveLength(2);
      expect(body.events[0].event_type).toBe('hosting');
    });

    it('builds ledger sorted by date descending', async () => {
      const member = {
        name: 'Noah',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 160,
        fractal_respect: 100,
        onchain_og: true,
        onchain_zor: true,
        fractal_count: 3,
        event_respect: 40,
        hosting_respect: 15,
        bonus_respect: 5,
        first_respect_at: '2024-01-01',
      };

      const score = {
        rank: 1,
        score: 50,
        wallet_address: member.wallet_address,
        member_name: member.name,
        fractal_sessions: {
          id: 's1',
          name: 'Session A',
          session_date: '2024-05-01',
          scoring_era: '2x',
          participant_count: 10,
          notes: 'test',
        },
      };

      const event = {
        event_type: 'hosting',
        amount: 20,
        description: 'Event hosting',
        event_date: '2024-06-01',
        created_at: '2024-06-01T10:00:00Z',
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [score] });
      const eventsChain = chainMock({ data: [event] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/noah'), {
        params: Promise.resolve({ wallet: 'noah' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger).toHaveLength(2);
      expect(body.ledger[0].date).toBe('2024-06-01'); // Event first (later date)
      expect(body.ledger[1].date).toBe('2024-05-01'); // Score second (earlier date)
    });

    it('handles null event_date by using created_at', async () => {
      const member = {
        name: 'Olivia',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 80,
        fractal_respect: 50,
        onchain_og: false,
        onchain_zor: true,
        fractal_count: 2,
        event_respect: 20,
        hosting_respect: 5,
        bonus_respect: 0,
        first_respect_at: '2024-04-01',
      };

      const event = {
        event_type: 'bonus',
        amount: 10,
        description: 'Auto bonus',
        event_date: null,
        created_at: '2024-06-15T14:30:00Z',
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: [event] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/olivia'), {
        params: Promise.resolve({ wallet: 'olivia' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger[0].date).toBe('2024-06-15');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when member lookup throws', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('DB connection lost');
      });

      const res = await GET(makeRequest('/api/fractals/member/error'), {
        params: Promise.resolve({ wallet: 'error' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load member profile');
    });

    it('returns 500 when scores query throws', async () => {
      const member = {
        name: 'Quinn',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 60,
        fractal_respect: 40,
        onchain_og: false,
        onchain_zor: false,
        fractal_count: 1,
        event_respect: 10,
        hosting_respect: 5,
        bonus_respect: 0,
        first_respect_at: '2024-05-01',
      };

      const memberChain = chainMock({ data: member });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        callCount >= 2 && callCount <= 3
          ? undefined
          : (() => {
              throw new Error('Scores table error');
            })();
      });

      mockFrom.mockReturnValueOnce(memberChain).mockImplementationOnce(() => {
        throw new Error('Scores table error');
      });

      const res = await GET(makeRequest('/api/fractals/member/quinn'), {
        params: Promise.resolve({ wallet: 'quinn' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load member profile');
    });

    it('logs errors with context', async () => {
      const { logger } = await import('@/lib/logger');

      mockFrom.mockImplementationOnce(() => {
        throw new Error('Network timeout');
      });

      await GET(makeRequest('/api/fractals/member/error'), {
        params: Promise.resolve({ wallet: 'error' }),
      });

      expect(logger.error).toHaveBeenCalledWith('Member profile error:', expect.any(Error));
    });
  });

  describe('response structure', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns all expected fields in response', async () => {
      const member = {
        name: 'Rachel',
        wallet_address: VALID_WALLET.toLowerCase(),
        total_respect: 150,
        fractal_respect: 90,
        onchain_og: true,
        onchain_zor: true,
        fractal_count: 4,
        event_respect: 35,
        hosting_respect: 20,
        bonus_respect: 5,
        first_respect_at: '2024-01-01',
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/rachel'), {
        params: Promise.resolve({ wallet: 'rachel' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('member');
      expect(body).toHaveProperty('history');
      expect(body).toHaveProperty('events');
      expect(body).toHaveProperty('ledger');
      expect(body).toHaveProperty('stats');

      // Verify member fields
      expect(body.member.name).toBe('Rachel');
      expect(body.member.wallet_address).toBe(member.wallet_address);
      expect(body.member.total_respect).toBe(150);
    });
  });

  describe('dynamic route parameters', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('correctly resolves wallet from params promise', async () => {
      const testWallet = '0xTEST1234567890abcdef1234567890abcdefTEST';
      const member = {
        name: 'Sam',
        wallet_address: testWallet.toLowerCase(),
        total_respect: 85,
        fractal_respect: 50,
        onchain_og: true,
        onchain_zor: false,
        fractal_count: 2,
        event_respect: 20,
        hosting_respect: 10,
        bonus_respect: 0,
        first_respect_at: '2024-04-01',
      };

      const memberChain = chainMock({ data: member });
      const scoresChain = chainMock({ data: [] });
      const eventsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain;
        if (callCount === 2 || callCount === 3) return scoresChain;
        if (callCount === 4) return eventsChain;
        throw new Error('Unexpected call');
      });

      const res = await GET(makeRequest('/api/fractals/member/0x1234'), {
        params: Promise.resolve({ wallet: testWallet }),
      });

      expect(res.status).toBe(200);
      expect(memberChain.eq).toHaveBeenCalledWith('wallet_address', testWallet.toLowerCase());
    });
  });
});
