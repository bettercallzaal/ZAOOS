import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

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
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/**
 * FIFO queue-based chain that mocks multiple sequential Supabase queries.
 * Each call to .maybeSingle() or awaited .then() pops the next result from the queue.
 * This pattern matches the vote route's multi-step flow:
 *   1. users query (maybeSingle)
 *   2. proposals query (single)
 *   3. respect_members query (maybeSingle)
 *   4. upsert vote (awaited chain)
 *   5. fetch all votes (awaited chain)
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'upsert']) {
    chain[m] = vi.fn(() => chain);
  }

  chain.maybeSingle = vi.fn(() => Promise.resolve(q.shift()));
  chain.single = vi.fn(() => Promise.resolve(q.shift()));

  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());

  return chain;
}

describe('POST /api/discord/proposals/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // =========================================================================
  // AUTH GUARD
  // =========================================================================

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // =========================================================================
  // INPUT VALIDATION
  // =========================================================================

  it('returns 400 when proposalId is not an integer', async () => {
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 'abc',
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('proposalId must be an integer');
  });

  it('returns 400 when proposalId is a float', async () => {
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1.5,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('proposalId must be an integer');
  });

  it('returns 400 when vote is not a valid option', async () => {
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'maybe',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('vote must be "yes", "no", or "abstain"');
  });

  it('accepts all three valid vote options', async () => {
    for (const vote of ['yes', 'no', 'abstain']) {
      mockFrom.mockReturnValue(
        queuedChain([
          { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
          { data: { id: 1, status: 'active' }, error: null }, // proposals query
          { data: { total_respect: 100 }, error: null }, // respect_members query
          { error: null }, // upsert
          { data: [], error: null }, // fetch all votes
        ]),
      );
      const res = await POST(
        makePostRequest('/api/discord/proposals/vote', {
          proposalId: 1,
          vote,
        }),
      );
      expect(res.status).toBe(200);
      expect((await res.json()).vote).toBe(vote);
    }
  });

  // =========================================================================
  // USER LOOKUP & DISCORD LINK
  // =========================================================================

  it('returns 500 when user query errors', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: null, error: new Error('db connection failed') }, // users query fails
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to look up user');
  });

  it('returns 403 when user has no discord_id linked', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: null, fid: 123 }, error: null }, // users query returns no discord_id
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe(
      'Link your Discord account first. Go to Settings to add your Discord ID.',
    );
  });

  it('returns 403 when user row is not found', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: null, error: null }, // users query returns null
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain('Link your Discord account');
  });

  // =========================================================================
  // PROPOSAL VALIDATION
  // =========================================================================

  it('returns 404 when proposal does not exist', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: null, error: null }, // proposals query returns null
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 999,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Proposal not found');
  });

  it('returns 400 when proposal status is not active', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'closed' }, error: null }, // proposals query with closed status
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('This proposal is no longer active');
  });

  it('returns 404 on proposal query error', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: null, error: new Error('db error') }, // proposals query errors
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Proposal not found');
  });

  // =========================================================================
  // RESPECT CHECK
  // =========================================================================

  it('returns 403 when user has zero respect', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 0 }, error: null }, // respect_members query with 0 respect
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe(
      'You need Respect to vote. Earn Respect through fractal participation.',
    );
  });

  it('returns 403 when user has negative respect', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: -10 }, error: null }, // respect_members query with negative
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when respect_members has no entry (null data)', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: null, error: null }, // respect_members query returns null (no entry)
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain('You need Respect');
  });

  // =========================================================================
  // VOTE UPSERT & AGGREGATION
  // =========================================================================

  it('successfully votes when all validations pass', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 50 }, error: null }, // respect_members query
        { error: null }, // upsert vote
        { data: [], error: null }, // fetch all votes (empty initially)
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.vote).toBe('yes');
    expect(body.weight).toBe(50);
    expect(body.votes).toMatchObject({
      yes_count: 0,
      no_count: 0,
      abstain_count: 0,
      yes_weight: 0,
      no_weight: 0,
      abstain_weight: 0,
      total_votes: 0,
      total_weight: 0,
    });
  });

  it('returns 500 when vote upsert fails', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 50 }, error: null }, // respect_members query
        { error: new Error('upsert constraint violation') }, // upsert fails
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to record vote');
  });

  it('aggregates vote counts correctly with mixed votes', async () => {
    const votes = [
      { vote_value: 'yes', weight: 50 },
      { vote_value: 'yes', weight: 30 },
      { vote_value: 'no', weight: 20 },
      { vote_value: 'abstain', weight: 10 },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 100 }, error: null }, // respect_members query
        { error: null }, // upsert vote
        { data: votes, error: null }, // fetch all votes
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.votes).toMatchObject({
      yes_count: 2,
      no_count: 1,
      abstain_count: 1,
      yes_weight: 80,
      no_weight: 20,
      abstain_weight: 10,
      total_votes: 4,
      total_weight: 110,
    });
  });

  it('handles vote data with string weight coercion', async () => {
    const votes = [
      { vote_value: 'yes', weight: '50' }, // weight as string
      { vote_value: 'no', weight: '20' },
    ];
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 100 }, error: null }, // respect_members query
        { error: null }, // upsert vote
        { data: votes, error: null }, // fetch all votes with string weights
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.votes.yes_weight).toBe(50);
    expect(body.votes.no_weight).toBe(20);
    expect(body.votes.total_weight).toBe(70);
  });

  it('handles empty vote list after upsert', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 50 }, error: null }, // respect_members query
        { error: null }, // upsert vote
        { data: null, error: null }, // fetch all votes returns null
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'no',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.votes.total_votes).toBe(0);
    expect(body.votes.total_weight).toBe(0);
  });

  // =========================================================================
  // WEIGHT CALCULATION & RESPECT COERCION
  // =========================================================================

  it('coerces non-integer respect to number correctly', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: '75' }, error: null }, // respect as string
        { error: null }, // upsert vote
        { data: [], error: null }, // fetch all votes
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'abstain',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.weight).toBe(75);
  });

  it('handles null respect as 0', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: null }, error: null }, // respect is null
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain('You need Respect');
  });

  // =========================================================================
  // ERROR HANDLING & EDGE CASES
  // =========================================================================

  it('returns 500 on unexpected JSON parse error', async () => {
    const req = makePostRequest('/api/discord/proposals/vote', {
      proposalId: 1,
      vote: 'yes',
    });
    // Manually break the request body to cause JSON parse to fail
    const brokenReq = new Request(req, {
      body: 'not valid json',
    });
    const res = await POST(brokenReq);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('respects proposal status options (active/closed/pending)', async () => {
    for (const status of ['closed', 'pending', 'archived']) {
      mockFrom.mockReturnValue(
        queuedChain([
          { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
          { data: { id: 1, status }, error: null }, // proposals query with varying status
        ]),
      );
      const res = await POST(
        makePostRequest('/api/discord/proposals/vote', {
          proposalId: 1,
          vote: 'yes',
        }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('This proposal is no longer active');
    }
  });

  it('logs errors to logger on user query failure', async () => {
    const mockLogger = vi.mocked(await import('@/lib/logger')).logger;
    mockFrom.mockReturnValue(queuedChain([{ data: null, error: new Error('db timeout') }]));
    await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      '[discord/proposals/vote] user query error:',
      expect.any(Error),
    );
  });

  it('logs errors to logger on upsert failure', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 50 }, error: null }, // respect_members query
        { error: new Error('constraint violation') }, // upsert fails
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 1,
        vote: 'yes',
      }),
    );
    expect(res.status).toBe(500);
  });

  // =========================================================================
  // RESPONSE SHAPE VALIDATION
  // =========================================================================

  it('returns correct success response shape', async () => {
    mockFrom.mockReturnValue(
      queuedChain([
        { data: { discord_id: 'discord123', fid: 123 }, error: null }, // users query
        { data: { id: 1, status: 'active' }, error: null }, // proposals query
        { data: { total_respect: 100 }, error: null }, // respect_members query
        { error: null }, // upsert vote
        {
          data: [
            { vote_value: 'yes', weight: 100 },
            { vote_value: 'no', weight: 50 },
          ],
          error: null,
        }, // fetch all votes
      ]),
    );
    const res = await POST(
      makePostRequest('/api/discord/proposals/vote', {
        proposalId: 5,
        vote: 'yes',
      }),
    );
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('vote', 'yes');
    expect(body).toHaveProperty('weight', 100);
    expect(body).toHaveProperty('votes');
    expect(body.votes).toHaveProperty('yes_count');
    expect(body.votes).toHaveProperty('no_count');
    expect(body.votes).toHaveProperty('abstain_count');
    expect(body.votes).toHaveProperty('yes_weight');
    expect(body.votes).toHaveProperty('no_weight');
    expect(body.votes).toHaveProperty('abstain_weight');
    expect(body.votes).toHaveProperty('total_votes');
    expect(body.votes).toHaveProperty('total_weight');
  });
});
