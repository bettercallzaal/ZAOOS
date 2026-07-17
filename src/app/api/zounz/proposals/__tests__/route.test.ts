// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/../community.config', () => ({
  communityConfig: {
    zounz: { nounsBuilderUrl: 'https://nouns.build/dao/base/0xabc' },
    adminFids: [1],
  },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockReadContract = vi.hoisted(() => vi.fn());
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({ readContract: mockReadContract })),
  };
});

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

describe('GET /api/zounz/proposals', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns governance data when all contract reads succeed', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockReadContract
      .mockResolvedValueOnce(BigInt(5))   // proposalCount
      .mockResolvedValueOnce(BigInt(100)) // proposalThreshold
      .mockResolvedValueOnce(BigInt(50)); // quorum
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.proposalCount).toBe(5);
    expect(body.proposalThreshold).toBe(100);
    expect(body.quorum).toBe(50);
    expect(body.governorAddress).toBeDefined();
    expect(body.voteUrl).toContain('nouns.build');
  });

  it('returns 0/null for fields when contract reads fail', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockReadContract.mockRejectedValue(new Error('RPC error'));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.proposalCount).toBe(0);
    expect(body.proposalThreshold).toBeNull();
    expect(body.quorum).toBeNull();
  });
});
