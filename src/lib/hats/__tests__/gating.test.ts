import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsWearerOfHat = vi.hoisted(() => vi.fn());
const mockGetWornHats = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hats/client', () => ({
  isWearerOfHat: (...args: unknown[]) => mockIsWearerOfHat(...args),
  getWornHats: (...args: unknown[]) => mockGetWornHats(...args),
}));

import { hasPermission, getPermissions, getRoles, isHatAdmin, requirePermission } from '@/lib/hats/gating';
import { HAT_IDS } from '@/lib/hats/constants';

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;

describe('Hat-based gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('returns true when wallet wears a hat with the permission', async () => {
      mockIsWearerOfHat.mockResolvedValue(true);
      const result = await hasPermission(TEST_WALLET, 'admin');
      expect(result).toBe(true);
    });

    it('returns false when wallet wears no matching hats', async () => {
      mockIsWearerOfHat.mockResolvedValue(false);
      const result = await hasPermission(TEST_WALLET, 'admin');
      expect(result).toBe(false);
    });

    it('handles RPC errors gracefully (treats as not wearing)', async () => {
      mockIsWearerOfHat.mockRejectedValue(new Error('RPC error'));
      const result = await hasPermission(TEST_WALLET, 'admin');
      expect(result).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('returns all permissions for a configurator', async () => {
      mockGetWornHats.mockResolvedValue([HAT_IDS.configurator]);
      const perms = await getPermissions(TEST_WALLET);
      expect(perms).toContain('admin');
      expect(perms).toContain('moderate');
      expect(perms).toContain('governance');
    });

    it('returns empty array when no hats worn', async () => {
      mockGetWornHats.mockResolvedValue([]);
      const perms = await getPermissions(TEST_WALLET);
      expect(perms).toEqual([]);
    });

    it('deduplicates permissions across multiple hats', async () => {
      mockGetWornHats.mockResolvedValue([HAT_IDS.configurator, HAT_IDS.governanceCouncil]);
      const perms = await getPermissions(TEST_WALLET);
      const uniquePerms = [...new Set(perms)];
      expect(perms.length).toBe(uniquePerms.length);
    });
  });

  describe('getRoles', () => {
    it('returns matching roles with labels', async () => {
      mockGetWornHats.mockResolvedValue([HAT_IDS.councilMembers]);
      const roles = await getRoles(TEST_WALLET);
      expect(roles).toHaveLength(1);
      expect(roles[0].label).toBe('Council Members');
      expect(roles[0].permissions).toContain('governance');
    });

    it('returns empty array when no roles worn', async () => {
      mockGetWornHats.mockResolvedValue([]);
      const roles = await getRoles(TEST_WALLET);
      expect(roles).toEqual([]);
    });
  });

  describe('isHatAdmin', () => {
    it('returns true for configurator wearer', async () => {
      mockIsWearerOfHat.mockImplementation(
        (_wallet: string, hatId: bigint) => Promise.resolve(hatId === HAT_IDS.configurator)
      );
      const result = await isHatAdmin(TEST_WALLET);
      expect(result).toBe(true);
    });

    it('returns false for non-admin wearer', async () => {
      mockIsWearerOfHat.mockResolvedValue(false);
      const result = await isHatAdmin(TEST_WALLET);
      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('returns null when wallet has permission', async () => {
      mockIsWearerOfHat.mockResolvedValue(true);
      const result = await requirePermission(TEST_WALLET, 'moderate');
      expect(result).toBeNull();
    });

    it('returns error object when wallet lacks permission', async () => {
      mockIsWearerOfHat.mockResolvedValue(false);
      const result = await requirePermission(TEST_WALLET, 'moderate');
      expect(result).not.toBeNull();
      expect(result?.error).toContain('Missing required permission');
      expect(result?.required).toBe('moderate');
    });

    it('returns error when wallet is null', async () => {
      const result = await requirePermission(null, 'admin');
      expect(result).not.toBeNull();
      expect(result?.error).toContain('Wallet address required');
    });

    it('returns error when wallet is undefined', async () => {
      const result = await requirePermission(undefined, 'admin');
      expect(result).not.toBeNull();
    });
  });
});
