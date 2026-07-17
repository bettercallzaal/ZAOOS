// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock viem before the module loads — conviction.ts creates a publicClient
// at module level via createPublicClient.
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

// conviction.ts checks ZABAL_STAKING_CONTRACT at call time.
// By default in tests, NEXT_PUBLIC_ZABAL_STAKING_CONTRACT is not set,
// so ZABAL_STAKING_CONTRACT = '' (falsy) — getConvictionBatch returns []
// immediately without calling readContract.

import { getConvictionBatch } from '../conviction';

beforeEach(() => {
  mockReadContract.mockReset();
});

describe('getConvictionBatch (no contract configured)', () => {
  it('returns an empty array for an empty address list', async () => {
    const result = await getConvictionBatch([]);
    expect(result).toEqual([]);
    // No readContract calls — short-circuited at contract check or empty array
    expect(mockReadContract).not.toHaveBeenCalled();
  });

  it('returns an empty array when ZABAL_STAKING_CONTRACT is not set', async () => {
    const result = await getConvictionBatch(['0x0000000000000000000000000000000000000001']);
    expect(result).toEqual([]);
    // Short-circuited at !ZABAL_STAKING_CONTRACT check
    expect(mockReadContract).not.toHaveBeenCalled();
  });
});
