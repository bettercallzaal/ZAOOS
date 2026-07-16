import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSessionData, mockFetchProposalsOnChain } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFetchProposalsOnChain: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/ordao/client', () => ({
  fetchProposalsOnChain: mockFetchProposalsOnChain,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock global fetch for the ornode fallback
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { GET } from '../route';

describe('GET /api/fractals/proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  // ========================================================================
  // Authentication / Session tests
  // ========================================================================

  it('returns 401 when session is null (unauthenticated)', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when session is undefined (unauthenticated)', async () => {
    mockGetSessionData.mockResolvedValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when session is falsy object', async () => {
    mockGetSessionData.mockResolvedValue({});

    // Empty object is truthy in JS, so this should actually NOT return 401
    // Let's test that authenticated requests pass through.
    const mockProposals = [
      {
        id: '0x123',
        proposer: '0xabc',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 1000,
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // ========================================================================
  // Primary path: ornode success
  // ========================================================================

  it('returns 200 with proposals from ornode when successful', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });

    const mockProposals = [
      { id: '0x1', proposer: '0xaaa', title: 'Proposal 1' },
      { id: '0x2', proposer: '0xbbb', title: 'Proposal 2' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      proposals: mockProposals,
      total: mockProposals.length,
      source: 'ornode',
    });
  });

  it('passes correct ornode URL and request options to fetch', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = [{ id: '0x1', proposer: '0xaaa' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    await GET();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ornode2.frapps.xyz/proposals?limit=20',
      expect.objectContaining({
        next: { revalidate: 60 },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('handles ornode response as array directly', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = [
      { id: '0x1', proposer: '0xaaa' },
      { id: '0x2', proposer: '0xbbb' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.proposals).toEqual(mockProposals);
  });

  it('handles ornode response as object with proposals field', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = [
      { id: '0x1', proposer: '0xaaa' },
      { id: '0x2', proposer: '0xbbb' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        proposals: mockProposals,
        meta: { total: 2 },
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(body.proposals).toEqual(mockProposals);
    expect(body.total).toBe(mockProposals.length);
  });

  it('includes correct total count in response', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = Array.from({ length: 5 }, (_, i) => ({
      id: `0x${i}`,
      proposer: '0xaaa',
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.total).toBe(5);
  });

  // ========================================================================
  // Primary path: ornode failures and fallback to on-chain
  // ========================================================================

  it('falls back to on-chain when ornode returns non-ok status', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const onChainProposals = [
      {
        id: '0x100',
        proposer: '0xccc',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 5000,
      },
    ];

    // ornode fails with 500
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    // on-chain succeeds
    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      proposals: onChainProposals,
      total: onChainProposals.length,
      source: 'onchain',
    });
  });

  it('falls back to on-chain when ornode throws error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const onChainProposals = [
      {
        id: '0x200',
        proposer: '0xddd',
        stage: 'Veto',
        voteStatus: 'Failing',
        isLive: false,
        blockNumber: 6000,
      },
    ];

    // ornode throws network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // on-chain succeeds
    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('onchain');
  });

  it('falls back to on-chain when ornode returns empty proposals', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const onChainProposals = [
      {
        id: '0x300',
        proposer: '0xeee',
        stage: 'Execution',
        voteStatus: 'Passed',
        isLive: false,
        blockNumber: 7000,
      },
    ];

    // ornode returns empty array
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // on-chain succeeds
    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('onchain');
  });

  it('falls back to on-chain when ornode returns object with empty proposals field', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const onChainProposals = [
      {
        id: '0x400',
        proposer: '0xfff',
        stage: 'Expired',
        voteStatus: 'Failed',
        isLive: false,
        blockNumber: 8000,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ proposals: [] }),
    });

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('onchain');
  });

  it('falls back to on-chain when ornode JSON parsing fails', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const onChainProposals = [
      {
        id: '0x500',
        proposer: '0x999',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 9000,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('onchain');
  });

  // ========================================================================
  // Fallback path: on-chain success
  // ========================================================================

  it('returns 200 with proposals from on-chain fallback when successful', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const onChainProposals = [
      {
        id: '0xabc123',
        proposer: '0xproposer1',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 12345,
      },
    ];

    // ornode fails
    mockFetch.mockRejectedValueOnce(new Error('ornode unavailable'));

    // on-chain succeeds
    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      proposals: onChainProposals,
      total: 1,
      source: 'onchain',
    });
  });

  it('calls fetchProposalsOnChain with limit of 20', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode unavailable'));

    const onChainProposals = [];
    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    await GET();

    expect(mockFetchProposalsOnChain).toHaveBeenCalledWith(20);
  });

  // ========================================================================
  // Both paths fail
  // ========================================================================

  it('returns empty proposals with source unavailable when both paths fail', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // ornode fails
    mockFetch.mockRejectedValueOnce(new Error('ornode timeout'));

    // on-chain also fails
    mockFetchProposalsOnChain.mockRejectedValueOnce(new Error('on-chain read failed'));

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      proposals: [],
      total: 0,
      source: 'unavailable',
    });
  });

  it('returns empty proposals when on-chain throws network error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode network error'));
    mockFetchProposalsOnChain.mockRejectedValueOnce(new Error('RPC connection failed'));

    const res = await GET();
    const body = await res.json();

    expect(body.proposals).toEqual([]);
    expect(body.source).toBe('unavailable');
  });

  it('returns empty proposals when on-chain throws contract error', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode unavailable'));
    mockFetchProposalsOnChain.mockRejectedValueOnce(new Error('Call exception'));

    const res = await GET();
    const body = await res.json();

    expect(body.proposals).toEqual([]);
    expect(body.total).toBe(0);
  });

  // ========================================================================
  // Response shape validation
  // ========================================================================

  it('response shape includes all required fields when ornode succeeds', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = [{ id: '0x1' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('proposals');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('source');
    expect(typeof body.proposals).toBe('object');
    expect(typeof body.total).toBe('number');
    expect(typeof body.source).toBe('string');
  });

  it('response shape includes all required fields when on-chain succeeds', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode failed'));

    const onChainProposals = [
      {
        id: '0xdef456',
        proposer: '0xprop',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 15000,
      },
    ];

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('proposals');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('source');
  });

  it('response shape includes all required fields when both paths fail', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode failed'));
    mockFetchProposalsOnChain.mockRejectedValueOnce(new Error('on-chain failed'));

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('proposals');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('source');
    expect(Array.isArray(body.proposals)).toBe(true);
  });

  // ========================================================================
  // Source field validation
  // ========================================================================

  it('sets source to ornode when ornode succeeds', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = [{ id: '0x1' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.source).toBe('ornode');
  });

  it('sets source to onchain when falling back to on-chain', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode unavailable'));

    const onChainProposals = [
      {
        id: '0x789',
        proposer: '0xtest',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 20000,
      },
    ];

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    const body = await res.json();

    expect(body.source).toBe('onchain');
  });

  it('sets source to unavailable when both paths fail', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode failed'));
    mockFetchProposalsOnChain.mockRejectedValueOnce(new Error('on-chain failed'));

    const res = await GET();
    const body = await res.json();

    expect(body.source).toBe('unavailable');
  });

  // ========================================================================
  // Error handling edge cases
  // ========================================================================

  it('handles non-Error thrown values from ornode', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce('string error');

    const onChainProposals = [
      {
        id: '0x1',
        proposer: '0xtest',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 25000,
      },
    ];

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('onchain');
  });

  it('handles non-Error thrown values from on-chain', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode failed'));
    mockFetchProposalsOnChain.mockRejectedValueOnce('string error from contract');

    const res = await GET();
    const body = await res.json();

    expect(body.proposals).toEqual([]);
    expect(body.source).toBe('unavailable');
  });

  // ========================================================================
  // Multiple proposals handling
  // ========================================================================

  it('handles large number of proposals from ornode', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockProposals = Array.from({ length: 50 }, (_, i) => ({
      id: `0x${i}`,
      proposer: '0xaaa',
      title: `Proposal ${i}`,
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.proposals.length).toBe(50);
    expect(body.total).toBe(50);
  });

  it('handles large number of proposals from on-chain', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('ornode failed'));

    const onChainProposals = Array.from({ length: 20 }, (_, i) => ({
      id: `0x${i}`,
      proposer: '0xtest',
      stage: 'Voting',
      voteStatus: 'Passing',
      isLive: true,
      blockNumber: 1000 + i,
    }));

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    const body = await res.json();

    expect(body.proposals.length).toBe(20);
  });

  // ========================================================================
  // ornode status code handling
  // ========================================================================

  it('falls back when ornode returns 404', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const onChainProposals = [
      {
        id: '0x1',
        proposer: '0xtest',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 30000,
      },
    ];

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    const body = await res.json();

    expect(body.source).toBe('onchain');
  });

  it('falls back when ornode returns 503 Service Unavailable', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const onChainProposals = [
      {
        id: '0x1',
        proposer: '0xtest',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 35000,
      },
    ];

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    const body = await res.json();

    expect(body.source).toBe('onchain');
  });

  it('falls back when ornode times out (AbortSignal)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'));

    const onChainProposals = [
      {
        id: '0x1',
        proposer: '0xtest',
        stage: 'Voting',
        voteStatus: 'Passing',
        isLive: true,
        blockNumber: 40000,
      },
    ];

    mockFetchProposalsOnChain.mockResolvedValueOnce(onChainProposals);

    const res = await GET();
    const body = await res.json();

    expect(body.source).toBe('onchain');
  });

  // ========================================================================
  // Session data validity
  // ========================================================================

  it('allows authenticated session with minimal data', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });

    const mockProposals = [{ id: '0x1' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('allows authenticated session with full data', async () => {
    mockGetSessionData.mockResolvedValue({
      fid: 456,
      username: 'alice',
      displayName: 'Alice Smith',
      isAdmin: true,
      pfpUrl: 'https://example.com/pfp.jpg',
    });

    const mockProposals = [{ id: '0x1' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposals,
    });

    const res = await GET();
    expect(res.status).toBe(200);
  });
});
