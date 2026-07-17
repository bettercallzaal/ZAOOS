// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

// createPublicClient is module-level — mock must be in place before import
const mockGetBlockNumber = vi.hoisted(() => vi.fn().mockResolvedValue(BigInt(1_000_000)));
const mockGetLogs = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getBlockNumber: mockGetBlockNumber,
      getLogs: mockGetLogs,
    })),
  };
});

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', mockFetch);

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SUBGRAPH_PROPOSAL = {
  proposalId: '0xprop1',
  proposalNumber: 1,
  title: 'Fund ZAO',
  description: 'Fund ZAO development',
  proposer: { id: '0xproposer' },
  forVotes: '5',
  againstVotes: '1',
  abstainVotes: '0',
  voteStart: '1000',
  voteEnd: '2000',
  status: 'ACTIVE',
  timeCreated: '900',
  executableFrom: null,
  expiresAt: null,
};

describe('GET /api/zounz/proposals/list', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 200 with proposals when subgraph succeeds', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { dao: { proposals: [MOCK_SUBGRAPH_PROPOSAL] } },
      }),
    });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.proposals).toHaveLength(1);
    expect(body.proposals[0].proposalId).toBe('0xprop1');
  });

  it('returns 200 with empty proposals when both sources fail', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    // Subgraph fails
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    // getLogs also fails (rejected)
    mockGetLogs.mockRejectedValue(new Error('RPC unavailable'));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.proposals).toHaveLength(0);
    expect(body.error).toBeDefined();
  });

  it('returns 500 on unexpected error', async () => {
    mockGetSessionData.mockRejectedValue(new Error('session store down'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
