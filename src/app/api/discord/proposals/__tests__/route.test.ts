import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => {
  return {
    getSupabaseAdmin: vi.fn(() => ({
      from: mockFrom,
    })),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Chain whose chainable methods are inspectable spies. Supports .in(), .eq(),
 * .order(), .select(), .maybeSingle() and resolves when awaited. Used for both
 * the proposals query and the votes/userVotes queries.
 */
function proposalsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'eq', 'in']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/discord/proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Populated and empty proposals
  // ─────────────────────────────────────────────────────────────────────────

  it('returns empty list when no proposals exist', async () => {
    mockFrom.mockReturnValue(proposalsChain({ data: [], error: null }));
    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proposals).toEqual([]);
    expect(body.total).toBe(0);
    // userDiscordId is not included in response when no proposals (early return)
    expect(body).toHaveProperty('proposals');
    expect(body).toHaveProperty('total');
  });

  it('returns proposals with aggregated votes when proposals exist', async () => {
    const proposals = [
      { id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' },
      { id: 2, title: 'Proposal B', status: 'closed', proposal_type: 'text' },
    ];

    const votes = [
      { proposal_id: 1, vote_value: 'yes', weight: 10 },
      { proposal_id: 1, vote_value: 'yes', weight: 5 },
      { proposal_id: 1, vote_value: 'no', weight: 3 },
      { proposal_id: 2, vote_value: 'abstain', weight: 7 },
    ];

    const proposalsCall = proposalsChain({ data: proposals, error: null });
    const votesCall = proposalsChain({ data: votes, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsCall;
      if (table === 'discord_proposal_votes') return votesCall;
      return proposalsCall;
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.proposals.length).toBe(2);
    expect(body.total).toBe(2);

    // Proposal 1: 2x yes (15 weight), 1x no (3 weight)
    expect(body.proposals[0].id).toBe(1);
    expect(body.proposals[0].votes).toEqual({
      yes_count: 2,
      no_count: 1,
      abstain_count: 0,
      yes_weight: 15,
      no_weight: 3,
      abstain_weight: 0,
      total_votes: 3,
      total_weight: 18,
    });
    expect(body.proposals[0].userVote).toBeNull();

    // Proposal 2: 1x abstain (7 weight)
    expect(body.proposals[1].id).toBe(2);
    expect(body.proposals[1].votes).toEqual({
      yes_count: 0,
      no_count: 0,
      abstain_count: 1,
      yes_weight: 0,
      no_weight: 0,
      abstain_weight: 7,
      total_votes: 1,
      total_weight: 7,
    });
    expect(body.proposals[1].userVote).toBeNull();
  });

  it('includes default vote counts when votes query returns null', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    const proposalsCall = proposalsChain({ data: proposals, error: null });
    const votesCall = proposalsChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsCall;
      if (table === 'discord_proposal_votes') return votesCall;
      return proposalsCall;
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.proposals[0].votes).toEqual({
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

  // ─────────────────────────────────────────────────────────────────────────
  // Query params: status and type filtering
  // ─────────────────────────────────────────────────────────────────────────

  it('applies status filter when status param is provided (not "all")', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals', { status: 'active' }));

    expect(chain.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('does not apply status filter when status is "all"', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals', { status: 'all' }));

    // eq() should not be called for status filter when status='all'
    expect(chain.eq).not.toHaveBeenCalledWith('status', 'all');
  });

  it('defaults to status "all" when no status param is provided', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals'));

    // Should not call eq for status
    expect(chain.eq).not.toHaveBeenCalledWith('status', expect.anything());
  });

  it('applies type filter when type param is provided', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals', { type: 'governance' }));

    expect(chain.eq).toHaveBeenCalledWith('proposal_type', 'governance');
  });

  it('does not apply type filter when type param is not provided', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals'));

    // eq should only be called for the order, not for type
    expect(chain.eq).not.toHaveBeenCalled();
  });

  it('applies both status and type filters when both params are provided', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals', { status: 'closed', type: 'funding' }));

    expect(chain.eq).toHaveBeenCalledWith('status', 'closed');
    expect(chain.eq).toHaveBeenCalledWith('proposal_type', 'funding');
  });

  it('orders proposals by created_at descending', async () => {
    const chain = proposalsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/discord/proposals'));

    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // User authentication: discord_id and user votes
  // ─────────────────────────────────────────────────────────────────────────

  it('fetches user data when authenticated', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockFrom.mockReturnValue(proposalsChain({ data: proposals, error: null }));

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    // Verify the user table was attempted to be queried
    expect(mockFrom).toHaveBeenCalledWith('discord_proposals');
    expect(mockFrom).toHaveBeenCalledWith('discord_proposal_votes');
    // User table gets queried when authenticated
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('scopes user query to active users with matching fid', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

    const chain = proposalsChain({ data: proposals, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    // Verify the users table query was scoped correctly
    expect(chain.eq).toHaveBeenCalledWith('fid', 456);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('returns null userDiscordId when user is not authenticated', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    mockGetSessionData.mockResolvedValue(null); // Not authenticated

    const proposalsCall = proposalsChain({ data: proposals, error: null });
    const votesCall = proposalsChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsCall;
      if (table === 'discord_proposal_votes') return votesCall;
      return proposalsCall;
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.userDiscordId).toBeNull();
  });

  it('does not query user votes when user is not authenticated', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    mockGetSessionData.mockResolvedValue(null); // Not authenticated

    const tablesQueried: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      tablesQueried.push(table);
      if (table === 'discord_proposals') return proposalsChain({ data: proposals, error: null });
      if (table === 'discord_proposal_votes') return proposalsChain({ data: null, error: null });
      return proposalsChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    // Verify users table was not queried (no authentication)
    expect(tablesQueried).not.toContain('users');
    const body = await res.json();
    expect(body.userDiscordId).toBe(null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: proposals query, votes query
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when proposals query errors', async () => {
    mockFrom.mockReturnValue(proposalsChain({ data: null, error: new Error('db down') }));

    const res = await GET(makeGetRequest('/api/discord/proposals'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch proposals');
  });

  it('logs error and continues when votes query errors (does not return 500)', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    const proposalsCall = proposalsChain({ data: proposals, error: null });
    const votesCall = proposalsChain({ data: null, error: new Error('votes query failed') });

    const { logger } = await import('@/lib/logger');

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsCall;
      if (table === 'discord_proposal_votes') return votesCall;
      return proposalsCall;
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));

    expect(res.status).toBe(200);
    expect(logger.error).toHaveBeenCalledWith(
      '[discord/proposals] Votes query error:',
      expect.any(Error),
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Weight aggregation edge cases
  // ─────────────────────────────────────────────────────────────────────────

  it('converts weight to number, treating non-numeric weight as 0', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    const votes = [
      { proposal_id: 1, vote_value: 'yes', weight: 10 },
      { proposal_id: 1, vote_value: 'yes', weight: null }, // non-numeric
      { proposal_id: 1, vote_value: 'yes', weight: undefined }, // non-numeric
    ];

    const proposalsCall = proposalsChain({ data: proposals, error: null });
    const votesCall = proposalsChain({ data: votes, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsCall;
      if (table === 'discord_proposal_votes') return votesCall;
      return proposalsCall;
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.proposals[0].votes.yes_weight).toBe(10); // 10 + 0 + 0
    expect(body.proposals[0].votes.yes_count).toBe(3);
    expect(body.proposals[0].votes.total_weight).toBe(10);
  });

  it('aggregates multiple votes per proposal with different vote values', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    const votes = [
      { proposal_id: 1, vote_value: 'yes', weight: 5 },
      { proposal_id: 1, vote_value: 'no', weight: 3 },
      { proposal_id: 1, vote_value: 'abstain', weight: 2 },
      { proposal_id: 1, vote_value: 'yes', weight: 8 },
    ];

    const proposalsCall = proposalsChain({ data: proposals, error: null });
    const votesCall = proposalsChain({ data: votes, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsCall;
      if (table === 'discord_proposal_votes') return votesCall;
      return proposalsCall;
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));
    const body = await res.json();

    expect(body.proposals[0].votes).toEqual({
      yes_count: 2,
      no_count: 1,
      abstain_count: 1,
      yes_weight: 13,
      no_weight: 3,
      abstain_weight: 2,
      total_votes: 4,
      total_weight: 18,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Unexpected errors: try/catch
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 and logs error when an unexpected error is thrown', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected runtime error');
    });

    const { logger } = await import('@/lib/logger');

    const res = await GET(makeGetRequest('/api/discord/proposals'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalledWith(
      '[discord/proposals] Unexpected error:',
      expect.any(Error),
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Response headers
  // ─────────────────────────────────────────────────────────────────────────

  it('includes cache-control header on success with populated proposals', async () => {
    const proposals = [{ id: 1, title: 'Proposal A', status: 'active', proposal_type: 'curate' }];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'discord_proposals') return proposalsChain({ data: proposals, error: null });
      if (table === 'discord_proposal_votes') return proposalsChain({ data: null, error: null });
      return proposalsChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/discord/proposals'));

    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBe('public, s-maxage=120, stale-while-revalidate=30');
  });
});
