import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
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
  logger: { error: vi.fn() },
}));

import { GET } from '../route';

let testCallCount = 0;

/** Build a chainable Supabase mock that returns a specific result. */
function buildChain(result: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    not: vi.fn(),
    is: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    lte: vi.fn(),
    like: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    limit: vi.fn(),
    filter: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable for await
    then: vi.fn((resolve: (val: unknown) => void) => resolve(result)),
  };

  // All chainable methods return the chain
  Object.values(chain).forEach((fn) => {
    fn.mockReturnValue(chain);
  });

  // Override terminal methods to return results
  chain.maybeSingle.mockResolvedValue(result);
  chain.then.mockImplementation((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Helper to set up mocks for a multi-query sequence.
 * member -> scores -> events -> transfers
 */
function setupMocks(member: unknown, scores: unknown, events: unknown, transfers: unknown) {
  testCallCount = 0;

  const memberChain = buildChain({ data: member, error: null });
  const scoresChain = buildChain({ data: scores, error: null });
  const eventsChain = buildChain({ data: events, error: null });
  const transfersChain = buildChain({ data: transfers, error: null });

  mockFrom.mockImplementation(() => {
    testCallCount++;
    if (testCallCount === 1) return memberChain;
    if (testCallCount === 2) return scoresChain;
    if (testCallCount === 3) return eventsChain;
    if (testCallCount === 4) return transfersChain;
  });

  return {
    memberChain,
    scoresChain,
    eventsChain,
    transfersChain,
    getCallCount: () => testCallCount,
  };
}

describe('GET /api/respect/member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('parameter validation', () => {
    it('returns 400 when neither wallet nor fid is provided', async () => {
      const res = await GET(makeGetRequest('/api/respect/member'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('wallet or fid');
    });

    it('returns 400 when wallet is invalid format', async () => {
      const res = await GET(makeGetRequest('/api/respect/member', { wallet: 'not-a-wallet' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeTruthy();
    });

    it('returns 400 when wallet is missing 0x prefix', async () => {
      const res = await GET(
        makeGetRequest('/api/respect/member', {
          wallet: '1234567890abcdef1234567890abcdef12345678',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeTruthy();
    });

    it('returns 400 when wallet has wrong length', async () => {
      const res = await GET(
        makeGetRequest('/api/respect/member', { wallet: '0x1234567890abcdef' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeTruthy();
    });

    it('returns 400 when fid is not a positive integer', async () => {
      const res = await GET(makeGetRequest('/api/respect/member', { fid: '0' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeTruthy();
    });

    it('returns 400 when fid is negative', async () => {
      const res = await GET(makeGetRequest('/api/respect/member', { fid: '-1' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeTruthy();
    });

    it('returns 400 when fid is not a number', async () => {
      const res = await GET(makeGetRequest('/api/respect/member', { fid: 'abc' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeTruthy();
    });

    it('accepts a valid wallet address', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 1,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      setupMocks(member, [], [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.member.wallet_address).toBe(member.wallet_address);
    });

    it('accepts a valid fid', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      setupMocks(member, [], [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { fid: '123' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.member.fid).toBe(123);
    });
  });

  describe('member lookup success', () => {
    it('returns complete member data with all fields', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: '1500',
        fractal_respect: '800',
        event_respect: '400',
        hosting_respect: '200',
        bonus_respect: '100',
        onchain_og: '50',
        onchain_zor: '50',
        first_respect_at: '2024-01-01',
        fractal_count: 5,
        hosting_count: 2,
      };

      setupMocks(member, [], [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.member.name).toBe('Alice');
      expect(body.member.total_respect).toBe(1500);
      expect(body.member.fractal_respect).toBe(800);
      expect(body.member.event_respect).toBe(400);
      expect(body.member.hosting_respect).toBe(200);
      expect(body.member.bonus_respect).toBe(100);
      expect(body.member.onchain_og).toBe(50);
      expect(body.member.onchain_zor).toBe(50);
      expect(body.member.first_respect_at).toBe('2024-01-01');
      expect(body.member.fractal_count).toBe(5);
      expect(body.member.hosting_count).toBe(2);
    });

    it('returns fractal history sorted by date descending', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const scores = [
        {
          id: 's1',
          rank: 1,
          score: '100',
          session_id: 'sess2',
          fractal_sessions: {
            id: 'sess2',
            session_date: '2024-01-15',
            name: 'Session 2',
            scoring_era: 'era-2',
          },
        },
        {
          id: 's2',
          rank: 5,
          score: '50',
          session_id: 'sess1',
          fractal_sessions: {
            id: 'sess1',
            session_date: '2024-01-10',
            name: 'Session 1',
            scoring_era: 'era-1',
          },
        },
      ];

      setupMocks(member, scores, [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.fractalHistory).toHaveLength(2);
      expect(body.fractalHistory[0].session_date).toBe('2024-01-15');
      expect(body.fractalHistory[1].session_date).toBe('2024-01-10');
    });

    it('handles fractal history with null session data', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const scores = [
        {
          id: 's1',
          rank: 1,
          score: '100',
          session_id: 'sess1',
          fractal_sessions: null,
        },
      ];

      setupMocks(member, scores, [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.fractalHistory[0].session_date).toBe(null);
      expect(body.fractalHistory[0].session_name).toBe(null);
      expect(body.fractalHistory[0].scoring_era).toBe(null);
    });

    it('returns respect events', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const events = [
        {
          id: 'e1',
          event_type: 'introduction',
          amount: '50',
          description: 'Intro to ZAO',
          event_date: '2024-01-20',
          created_at: '2024-01-20T12:00:00Z',
        },
        {
          id: 'e2',
          event_type: 'article',
          amount: '100',
          description: 'Research article',
          event_date: '2024-01-15',
          created_at: '2024-01-15T12:00:00Z',
        },
      ];

      setupMocks(member, [], events, []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.events).toHaveLength(2);
      expect(body.events[0].event_type).toBe('introduction');
      expect(body.events[0].amount).toBe(50);
      expect(body.events[1].event_type).toBe('article');
      expect(body.events[1].amount).toBe(100);
    });

    it('builds ledger with fractal entries', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const scores = [
        {
          id: 's1',
          rank: 2,
          score: '100',
          session_id: 'sess1',
          fractal_sessions: {
            id: 'sess1',
            session_date: '2024-01-10',
            name: 'Test Session',
            scoring_era: 'era-1',
          },
        },
      ];

      setupMocks(member, scores, [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger).toHaveLength(1);
      expect(body.ledger[0].source).toBe('fractal');
      expect(body.ledger[0].type).toBe('Rank #2');
      expect(body.ledger[0].amount).toBe(100);
      expect(body.ledger[0].date).toBe('2024-01-10');
      expect(body.ledger[0].detail).toBe('Test Session');
    });

    it('builds ledger with event entries', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const events = [
        {
          id: 'e1',
          event_type: 'hosting',
          amount: '75',
          description: 'Hosted ZAO call',
          event_date: '2024-01-12',
          created_at: '2024-01-12T12:00:00Z',
        },
      ];

      setupMocks(member, [], events, []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger).toHaveLength(1);
      expect(body.ledger[0].source).toBe('event');
      expect(body.ledger[0].type).toBe('hosting');
      expect(body.ledger[0].amount).toBe(75);
      expect(body.ledger[0].date).toBe('2024-01-12');
    });

    it('handles events with null event_date and uses created_at', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const events = [
        {
          id: 'e1',
          event_type: 'bonus',
          amount: '50',
          description: 'Bonus respect',
          event_date: null,
          created_at: '2024-01-18T10:30:00Z',
        },
      ];

      setupMocks(member, [], events, []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger[0].date).toBe('2024-01-18');
    });

    it('builds ledger with onchain transfer entries (ZOR mint)', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const transfers = [
        {
          tx_hash: '0xabc123',
          from_address: '0x0000000000000000000000000000000000000000',
          token_type: 'zor_erc1155',
          amount: '10',
          block_timestamp: '2024-01-20T15:30:00Z',
        },
      ];

      setupMocks(member, [], [], transfers);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger[0].source).toBe('onchain');
      expect(body.ledger[0].type).toBe('ZOR mint');
      expect(body.ledger[0].amount).toBe(10);
      expect(body.ledger[0].detail).toBe('ZOR Respect minted on-chain');
      expect(body.ledger[0].date).toBe('2024-01-20');
    });

    it('builds ledger with onchain transfer entries (OG transfer)', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const transfers = [
        {
          tx_hash: '0xdef456',
          from_address: '0x1234567890abcdef1234567890abcdef12345678',
          token_type: 'og_erc1155',
          amount: '5',
          block_timestamp: '2024-01-22T08:15:00Z',
        },
      ];

      setupMocks(member, [], [], transfers);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger[0].source).toBe('onchain');
      expect(body.ledger[0].type).toBe('OG transfer');
      expect(body.ledger[0].amount).toBe(5);
      expect(body.ledger[0].detail).toContain('transfer from 0x123456');
    });

    it('sorts mixed ledger entries by date descending', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const scores = [
        {
          id: 's1',
          rank: 1,
          score: '50',
          session_id: 'sess1',
          fractal_sessions: {
            id: 'sess1',
            session_date: '2024-01-10',
            name: 'Fractal Session',
            scoring_era: 'era-1',
          },
        },
      ];

      const events = [
        {
          id: 'e1',
          event_type: 'article',
          amount: '100',
          description: 'Article',
          event_date: '2024-01-15',
          created_at: '2024-01-15T12:00:00Z',
        },
      ];

      const transfers = [
        {
          tx_hash: '0xabc123',
          from_address: '0x0000000000000000000000000000000000000000',
          token_type: 'zor_erc1155',
          amount: '10',
          block_timestamp: '2024-01-20T15:30:00Z',
        },
      ];

      setupMocks(member, scores, events, transfers);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger).toHaveLength(3);
      expect(body.ledger[0].date).toBe('2024-01-20'); // onchain
      expect(body.ledger[1].date).toBe('2024-01-15'); // event
      expect(body.ledger[2].date).toBe('2024-01-10'); // fractal
    });

    it('handles ledger entries with null dates (places at end)', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const events = [
        {
          id: 'e1',
          event_type: 'bonus',
          amount: '50',
          description: 'No date bonus',
          event_date: null,
          created_at: null,
        },
        {
          id: 'e2',
          event_type: 'article',
          amount: '100',
          description: 'Article',
          event_date: '2024-01-15',
          created_at: '2024-01-15T12:00:00Z',
        },
      ];

      setupMocks(member, [], events, []);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ledger[0].date).toBe('2024-01-15');
      expect(body.ledger[1].date).toBeNull();
    });

    it('omits onchain transfers when member wallet is not available', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: null,
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 0,
        onchain_zor: 0,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const { getCallCount } = setupMocks(member, [], [], []);

      const res = await GET(makeGetRequest('/api/respect/member', { fid: '123' }));
      await res.json(); // Parse to ensure response is valid JSON

      expect(res.status).toBe(200);
      expect(getCallCount()).toBe(3); // Only member, scores, events
    });
  });

  describe('member not found', () => {
    it('returns 404 when member is not found by wallet', async () => {
      const memberChain = chainMock({ data: null, error: null });

      mockFrom.mockReturnValueOnce(memberChain.chain);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Member not found');
    });

    it('returns 404 when member is not found by fid', async () => {
      const memberChain = chainMock({ data: null, error: null });

      mockFrom.mockReturnValueOnce(memberChain.chain);

      const res = await GET(makeGetRequest('/api/respect/member', { fid: '999' }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Member not found');
    });
  });

  describe('database errors', () => {
    it('returns 500 when member query fails', async () => {
      const memberChain = chainMock({ data: null, error: new Error('DB error') });

      mockFrom.mockReturnValueOnce(memberChain.chain);

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load member data');
    });

    it('returns 500 when fractal scores query fails', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const memberChain = chainMock({ data: member, error: null });
      const scoresChain = chainMock({ data: null, error: new Error('Scores DB error') });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return memberChain.chain;
        if (callCount === 2) return scoresChain.chain;
      });

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load member data');
    });

    it('returns 500 on unexpected error', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET(makeGetRequest('/api/respect/member', { wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load member data');
    });
  });

  describe('query parameter handling', () => {
    it('prefers wallet over fid when both are provided', async () => {
      const member = {
        id: '1',
        name: 'Alice',
        wallet_address: VALID_WALLET.toLowerCase(),
        fid: 123,
        total_respect: 100,
        fractal_respect: 50,
        event_respect: 30,
        hosting_respect: 10,
        bonus_respect: 10,
        onchain_og: 5,
        onchain_zor: 5,
        first_respect_at: '2024-01-01',
        fractal_count: 2,
        hosting_count: 1,
      };

      const { memberChain } = setupMocks(member, [], [], []);

      const res = await GET(
        makeGetRequest('/api/respect/member', { wallet: VALID_WALLET, fid: '999' }),
      );
      await res.json(); // Parse to ensure response is valid JSON

      expect(res.status).toBe(200);
      expect(memberChain.ilike).toHaveBeenCalled();
      expect(memberChain.eq).not.toHaveBeenCalledWith('fid', 999);
    });
  });
});
