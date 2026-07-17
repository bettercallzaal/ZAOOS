// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @hatsprotocol/sdk-v1-core so no on-chain calls are made.
const mockIsWearerOfHat = vi.hoisted(() => vi.fn());

vi.mock('@hatsprotocol/sdk-v1-core', () => ({
  HatsClient: vi.fn().mockImplementation(() => ({
    isWearerOfHat: mockIsWearerOfHat,
  })),
}));

// Also mock viem so createPublicClient doesn't try to reach Optimism.
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({})),
  };
});

import { getWornHats, isWearerOfHat } from '../client';

const WEARER = '0x0000000000000000000000000000000000000001' as `0x${string}`;
const HAT_A = BigInt('0x0001000100010001000100010001000000000000000000000000000000000000');
const HAT_B = BigInt('0x0001000100010002000000000000000000000000000000000000000000000000');
const HAT_C = BigInt('0x0001000100010003000000000000000000000000000000000000000000000000');

beforeEach(() => {
  mockIsWearerOfHat.mockReset();
});

describe('getWornHats', () => {
  it('returns an empty array for an empty hatIds list', async () => {
    const result = await getWornHats(WEARER, []);
    expect(result).toEqual([]);
    expect(mockIsWearerOfHat).not.toHaveBeenCalled();
  });

  it('returns all hatIds when the address wears all of them', async () => {
    mockIsWearerOfHat.mockResolvedValue(true);
    const result = await getWornHats(WEARER, [HAT_A, HAT_B]);
    expect(result).toEqual([HAT_A, HAT_B]);
  });

  it('returns only the worn subset when some hats are not worn', async () => {
    mockIsWearerOfHat
      .mockResolvedValueOnce(true)   // HAT_A — worn
      .mockResolvedValueOnce(false)  // HAT_B — not worn
      .mockResolvedValueOnce(true);  // HAT_C — worn
    const result = await getWornHats(WEARER, [HAT_A, HAT_B, HAT_C]);
    expect(result).toEqual([HAT_A, HAT_C]);
  });

  it('filters out hats where isWearerOfHat throws (allSettled rejected)', async () => {
    mockIsWearerOfHat
      .mockRejectedValueOnce(new Error('RPC error'))  // HAT_A — error → filtered
      .mockResolvedValueOnce(true);                   // HAT_B — worn
    const result = await getWornHats(WEARER, [HAT_A, HAT_B]);
    expect(result).toEqual([HAT_B]);
  });
});

describe('isWearerOfHat', () => {
  it('returns true when the client reports the address wears the hat', async () => {
    mockIsWearerOfHat.mockResolvedValue(true);
    const result = await isWearerOfHat(WEARER, HAT_A);
    expect(result).toBe(true);
    expect(mockIsWearerOfHat).toHaveBeenCalledWith({ wearer: WEARER, hatId: HAT_A });
  });

  it('returns false when the client reports the address does not wear the hat', async () => {
    mockIsWearerOfHat.mockResolvedValue(false);
    const result = await isWearerOfHat(WEARER, HAT_A);
    expect(result).toBe(false);
  });
});
