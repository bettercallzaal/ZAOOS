// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist the mock so it is available when vi.mock factory runs
const mockReadContract = vi.hoisted(() => vi.fn());

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mockReadContract,
    })),
  };
});

import { checkGatingEligibility } from '../fc-identity';

const ADDR = '0x0000000000000000000000000000000000000001' as `0x${string}`;

beforeEach(() => {
  mockReadContract.mockReset();
});

// checkGatingEligibility calls getFcQualityScore then resolveEthToFid via Promise.all.
// Within Promise.all the two readContract calls execute in declaration order:
//   call 1 → getFcQualityScore   → quality score (bigint)
//   call 2 → resolveEthToFid     → fid (bigint, cast to number)

describe('checkGatingEligibility', () => {
  it('returns eligible=false when fid resolves to null (rpc error)', async () => {
    // Both readContract calls throw → score=null, fid=null
    mockReadContract
      .mockRejectedValueOnce(new Error('rpc error'))
      .mockRejectedValueOnce(new Error('rpc error'));

    const result = await checkGatingEligibility(ADDR);
    expect(result.eligible).toBe(false);
    expect(result.fid).toBeNull();
    expect(result.score).toBeNull();
    expect(result.reason).toMatch(/No Far ?caster account/i);
  });

  it('returns eligible=true when score is null but fid is present (no negative signal)', async () => {
    // getFcQualityScore fails → null; resolveEthToFid succeeds → fid 12345
    mockReadContract
      .mockRejectedValueOnce(new Error('score rpc error'))
      .mockResolvedValueOnce(BigInt(12345));

    const result = await checkGatingEligibility(ADDR);
    expect(result.eligible).toBe(true);
    expect(result.score).toBeNull();
    expect(result.fid).toBe(12345);
    expect(result.reason).toBeUndefined();
  });

  it('returns eligible=false when score < minScore', async () => {
    mockReadContract
      .mockResolvedValueOnce(BigInt(50))   // score = 50
      .mockResolvedValueOnce(BigInt(12345)); // fid = 12345

    const result = await checkGatingEligibility(ADDR, 100);
    expect(result.eligible).toBe(false);
    expect(result.score).toBe(BigInt(50));
    expect(result.fid).toBe(12345);
    expect(result.reason).toMatch(/50.*below.*100/i);
  });

  it('returns eligible=true when score >= minScore', async () => {
    mockReadContract
      .mockResolvedValueOnce(BigInt(200))  // score = 200
      .mockResolvedValueOnce(BigInt(99));  // fid = 99

    const result = await checkGatingEligibility(ADDR, 100);
    expect(result.eligible).toBe(true);
    expect(result.score).toBe(BigInt(200));
    expect(result.fid).toBe(99);
    expect(result.reason).toBeUndefined();
  });

  it('returns eligible=true when score equals minScore (not strictly below)', async () => {
    mockReadContract
      .mockResolvedValueOnce(BigInt(100)) // score = minScore exactly
      .mockResolvedValueOnce(BigInt(7));  // fid = 7

    const result = await checkGatingEligibility(ADDR, 100);
    expect(result.eligible).toBe(true);
  });

  it('default minScore=0: score BigInt(0) is still eligible', async () => {
    mockReadContract
      .mockResolvedValueOnce(BigInt(0)) // score = 0, not < 0
      .mockResolvedValueOnce(BigInt(42));

    const result = await checkGatingEligibility(ADDR); // minScore defaults to 0
    expect(result.eligible).toBe(true);
    expect(result.score).toBe(BigInt(0));
  });
});
