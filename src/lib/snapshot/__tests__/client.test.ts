// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// Provide communityConfig before the module loads — snapshot/client.ts reads
// communityConfig.snapshot.graphqlUrl and .space at module load time.
vi.mock('@/../community.config', () => ({
  communityConfig: {
    snapshot: {
      graphqlUrl: 'https://hub.snapshot.org/graphql',
      space: 'zao.eth',
    },
  },
}));

import { fetchActivePolls, fetchPollResults, fetchRecentPolls } from '../client';

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const MOCK_PROPOSAL = {
  id: 'QmAbc',
  title: 'Proposal 1',
  body: 'Description',
  choices: ['Yes', 'No'],
  start: 1700000000,
  end: 1700100000,
  state: 'active' as const,
  scores: [10, 5],
  scores_total: 15,
  votes: 12,
  type: 'single-choice',
};

// ---------------------------------------------------------------------------
// fetchActivePolls
// ---------------------------------------------------------------------------

describe('fetchActivePolls', () => {
  it('returns proposals from a successful response', async () => {
    stubFetch(true, { data: { proposals: [MOCK_PROPOSAL] } });
    const result = await fetchActivePolls();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('QmAbc');
  });

  it('throws when the HTTP response is not OK', async () => {
    stubFetch(false, {});
    await expect(fetchActivePolls()).rejects.toThrow('Snapshot GraphQL error: 500');
  });

  it('throws when the response contains GraphQL errors', async () => {
    stubFetch(true, { errors: [{ message: 'Space not found' }] });
    await expect(fetchActivePolls()).rejects.toThrow('Snapshot GraphQL: Space not found');
  });
});

// ---------------------------------------------------------------------------
// fetchRecentPolls
// ---------------------------------------------------------------------------

describe('fetchRecentPolls', () => {
  it('returns recent proposals on a valid response', async () => {
    stubFetch(true, { data: { proposals: [MOCK_PROPOSAL, MOCK_PROPOSAL] } });
    const result = await fetchRecentPolls(2);
    expect(result).toHaveLength(2);
  });

  it('throws on HTTP error', async () => {
    stubFetch(false, {});
    await expect(fetchRecentPolls()).rejects.toThrow('Snapshot GraphQL error: 500');
  });
});

// ---------------------------------------------------------------------------
// fetchPollResults
// ---------------------------------------------------------------------------

describe('fetchPollResults', () => {
  it('returns a proposal when found', async () => {
    stubFetch(true, { data: { proposal: MOCK_PROPOSAL } });
    const result = await fetchPollResults('QmAbc');
    expect(result?.id).toBe('QmAbc');
  });

  it('returns null when the proposal does not exist', async () => {
    stubFetch(true, { data: { proposal: null } });
    const result = await fetchPollResults('not-found');
    expect(result).toBeNull();
  });

  it('throws on HTTP error', async () => {
    stubFetch(false, {});
    await expect(fetchPollResults('QmAbc')).rejects.toThrow('Snapshot GraphQL error: 500');
  });
});
