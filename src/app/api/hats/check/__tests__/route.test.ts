import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HAT_IDS, PROJECT_HAT_IDS } from '@/lib/hats/constants';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockIsWearerOfHat, mockGetWornHats } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockIsWearerOfHat: vi.fn(),
  mockGetWornHats: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/hats/client', () => ({
  isWearerOfHat: mockIsWearerOfHat,
  getWornHats: mockGetWornHats,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

const VALID_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const INVALID_WALLET = '0xinvalidaddress';
const ANOTHER_WALLET = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

describe('GET /api/hats/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockIsWearerOfHat).not.toHaveBeenCalled();
      expect(mockGetWornHats).not.toHaveBeenCalled();
    });

    it('allows authenticated users', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockGetWornHats.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));

      expect(res.status).toBe(200);
      expect(mockGetWornHats).toHaveBeenCalled();
    });
  });

  describe('wallet validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when wallet is missing', async () => {
      const res = await GET(makeGetRequest('/api/hats/check', {}));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error', 'Invalid input');
      expect(body).toHaveProperty('details');
    });

    it('returns 400 when wallet is malformed', async () => {
      const res = await GET(makeGetRequest('/api/hats/check', { wallet: INVALID_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error', 'Invalid input');
      expect(body).toHaveProperty('details');
    });

    it('returns 400 when wallet is not 0x-prefixed', async () => {
      const res = await GET(
        makeGetRequest('/api/hats/check', { wallet: '1234567890abcdef1234567890abcdef12345678' }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error', 'Invalid input');
    });

    it('returns 400 when wallet has wrong hex length', async () => {
      const res = await GET(makeGetRequest('/api/hats/check', { wallet: '0x12345' }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error', 'Invalid input');
    });

    it('accepts valid checksummed addresses', async () => {
      const checksummedWallet = '0x1234567890AbCdEf1234567890aBcDeF12345678';
      mockGetWornHats.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: checksummedWallet }));

      expect(res.status).toBe(200);
      expect(mockGetWornHats).toHaveBeenCalledWith(checksummedWallet, expect.any(Array));
    });
  });

  describe('specific hatId mode', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls isWearerOfHat when a specific hatId is provided', async () => {
      const hatId = HAT_IDS.topHat.toString();
      mockIsWearerOfHat.mockResolvedValue(true);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET, hatId }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(mockIsWearerOfHat).toHaveBeenCalledWith(VALID_WALLET, BigInt(hatId));
      expect(body).toEqual({
        wallet: VALID_WALLET,
        hatId,
        label: 'ZAO',
        isWearer: true,
      });
      expect(mockGetWornHats).not.toHaveBeenCalled();
    });

    it('returns false when wallet does not wear the specified hat', async () => {
      const hatId = PROJECT_HAT_IDS.community.toString();
      mockIsWearerOfHat.mockResolvedValue(false);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET, hatId }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({
        wallet: VALID_WALLET,
        hatId,
        label: 'Community',
        isWearer: false,
      });
    });

    it('returns null label for unknown hatId', async () => {
      const unknownHatId = '999999999999999999999999';
      mockIsWearerOfHat.mockResolvedValue(false);

      const res = await GET(
        makeGetRequest('/api/hats/check', { wallet: VALID_WALLET, hatId: unknownHatId }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({
        wallet: VALID_WALLET,
        hatId: unknownHatId,
        label: null,
        isWearer: false,
      });
    });

    it('handles large BigInt hatIds', async () => {
      const largeHatId = '1809251394333065553994240206374330039850244871680';
      mockIsWearerOfHat.mockResolvedValue(true);

      const res = await GET(
        makeGetRequest('/api/hats/check', { wallet: VALID_WALLET, hatId: largeHatId }),
      );
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(mockIsWearerOfHat).toHaveBeenCalledWith(VALID_WALLET, BigInt(largeHatId));
      expect(body).toHaveProperty('isWearer', true);
    });
  });

  describe('all-hats mode (no specific hatId)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls getWornHats when no hatId is provided', async () => {
      const wornHatIds = [BigInt(HAT_IDS.topHat), BigInt(PROJECT_HAT_IDS.community)];
      mockGetWornHats.mockResolvedValue(wornHatIds);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(mockGetWornHats).toHaveBeenCalledWith(VALID_WALLET, expect.any(Array));
      expect(mockIsWearerOfHat).not.toHaveBeenCalled();

      const expectedRoles = [
        { hatId: HAT_IDS.topHat.toString(), label: 'ZAO' },
        { hatId: PROJECT_HAT_IDS.community.toString(), label: 'Community' },
      ];
      expect(body).toEqual({
        wallet: VALID_WALLET,
        roles: expectedRoles,
      });
    });

    it('returns empty roles array when wallet wears no hats', async () => {
      mockGetWornHats.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({
        wallet: VALID_WALLET,
        roles: [],
      });
    });

    it('includes null labels for unknown hats in the list', async () => {
      const unknownHatId = BigInt('888888888888888888888888');
      const wornHatIds = [BigInt(HAT_IDS.configurator), unknownHatId];
      mockGetWornHats.mockResolvedValue(wornHatIds);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({
        wallet: VALID_WALLET,
        roles: [
          { hatId: HAT_IDS.configurator.toString(), label: 'Configurator' },
          { hatId: unknownHatId.toString(), label: null },
        ],
      });
    });

    it('handles multiple project hats with correct labels', async () => {
      const wornHatIds = [
        BigInt(PROJECT_HAT_IDS.zao101),
        BigInt(PROJECT_HAT_IDS.waveWarZDao),
        BigInt(PROJECT_HAT_IDS.cocConcertz),
      ];
      mockGetWornHats.mockResolvedValue(wornHatIds);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: ANOTHER_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({
        wallet: ANOTHER_WALLET,
        roles: [
          { hatId: PROJECT_HAT_IDS.zao101.toString(), label: 'ZAO 101' },
          { hatId: PROJECT_HAT_IDS.waveWarZDao.toString(), label: 'Wave WarZ DAO' },
          { hatId: PROJECT_HAT_IDS.cocConcertz.toString(), label: 'COC ConcertZ' },
        ],
      });
    });

    it('passes combined HAT_IDS + PROJECT_HAT_IDS to getWornHats', async () => {
      mockGetWornHats.mockResolvedValue([]);

      await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));

      const callArgs = mockGetWornHats.mock.calls[0];
      const passedHatIds = callArgs[1] as bigint[];

      // Verify it includes both HAT_IDS and PROJECT_HAT_IDS
      expect(passedHatIds).toContain(BigInt(HAT_IDS.topHat));
      expect(passedHatIds).toContain(BigInt(HAT_IDS.configurator));
      expect(passedHatIds).toContain(BigInt(PROJECT_HAT_IDS.community));
      expect(passedHatIds).toContain(BigInt(PROJECT_HAT_IDS.cocConcertz));
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when isWearerOfHat throws', async () => {
      const hatId = HAT_IDS.topHat.toString();
      mockIsWearerOfHat.mockRejectedValue(new Error('RPC error'));

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET, hatId }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to check hat status' });
    });

    it('returns 500 when getWornHats throws', async () => {
      mockGetWornHats.mockRejectedValue(new Error('Network error'));

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to check hat status' });
    });
  });

  describe('response shape consistency', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('always includes wallet in specific-hatId response', async () => {
      const hatId = HAT_IDS.topHat.toString();
      mockIsWearerOfHat.mockResolvedValue(false);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET, hatId }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).toHaveProperty('wallet', VALID_WALLET);
      expect(body).toHaveProperty('hatId');
      expect(body).toHaveProperty('label');
      expect(body).toHaveProperty('isWearer');
    });

    it('always includes wallet and roles in all-hats response', async () => {
      mockGetWornHats.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).toHaveProperty('wallet', VALID_WALLET);
      expect(body).toHaveProperty('roles');
      expect(Array.isArray(body.roles)).toBe(true);
    });

    it('does not return error field in successful responses', async () => {
      mockGetWornHats.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/hats/check', { wallet: VALID_WALLET }));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).not.toHaveProperty('error');
      expect(res.status).toBe(200);
    });
  });
});
