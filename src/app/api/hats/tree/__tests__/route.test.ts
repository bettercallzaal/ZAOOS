import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HatTreeResult } from '@/lib/hats/tree';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFetchHatTree } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFetchHatTree: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/hats/tree', () => ({
  fetchHatTree: mockFetchHatTree,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/hats/tree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockFetchHatTree).not.toHaveBeenCalled();
    });

    it('allows authenticated users to proceed', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: null,
        totalHats: 0,
        timestamp: Date.now(),
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));

      expect(res.status).toBe(200);
      expect(mockFetchHatTree).toHaveBeenCalled();
    });
  });

  describe('successful tree fetching', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 200 with tree data when fetchHatTree succeeds', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: {
          id: '1',
          prettyId: '1.0.0',
          details: 'Root hat',
          label: 'ZAO',
          imageUri: 'https://example.com/image.png',
          maxSupply: 1,
          supply: 1,
          eligibility: '0x0',
          toggle: '0x0',
          isMutable: false,
          isActive: true,
          children: [],
          level: 0,
          wearers: ['0x1234567890abcdef1234567890abcdef12345678'],
        },
        totalHats: 1,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual(mockTree);
      expect(mockFetchHatTree).toHaveBeenCalledTimes(1);
    });

    it('returns nested tree structure with children', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: {
          id: '1',
          prettyId: '1.0.0',
          details: 'Root',
          label: 'ZAO',
          imageUri: '',
          maxSupply: 1,
          supply: 1,
          eligibility: '',
          toggle: '',
          isMutable: false,
          isActive: true,
          children: [
            {
              id: '2',
              prettyId: '1.1.0',
              details: 'Child 1',
              label: 'Child Hat 1',
              imageUri: '',
              maxSupply: 10,
              supply: 5,
              eligibility: '',
              toggle: '',
              isMutable: true,
              isActive: true,
              children: [
                {
                  id: '3',
                  prettyId: '1.1.1',
                  details: 'Grandchild',
                  label: 'Grandchild Hat',
                  imageUri: '',
                  maxSupply: 100,
                  supply: 50,
                  eligibility: '',
                  toggle: '',
                  isMutable: false,
                  isActive: true,
                  children: [],
                  level: 2,
                  wearers: [],
                },
              ],
              level: 1,
              wearers: ['0x1111111111111111111111111111111111111111'],
            },
          ],
          level: 0,
          wearers: ['0x0000000000000000000000000000000000000000'],
        },
        totalHats: 3,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual(mockTree);

      const treeResult = body as HatTreeResult;
      expect(treeResult.root?.children).toHaveLength(1);
      expect(treeResult.root?.children[0]?.children).toHaveLength(1);
      expect(treeResult.totalHats).toBe(3);
    });

    it('returns empty tree when root is null', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: null,
        totalHats: 0,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual(mockTree);
    });

    it('includes all required fields in response', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: null,
        totalHats: 42,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).toHaveProperty('treeId', 1);
      expect(body).toHaveProperty('root');
      expect(body).toHaveProperty('totalHats', 42);
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when fetchHatTree throws an error', async () => {
      mockFetchHatTree.mockRejectedValue(new Error('RPC connection failed'));

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to load hat tree' });
      expect(mockFetchHatTree).toHaveBeenCalledTimes(1);
    });

    it('returns 500 when fetchHatTree throws a generic error', async () => {
      mockFetchHatTree.mockRejectedValue(new Error('Unexpected error'));

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to load hat tree' });
    });

    it('returns 500 when fetchHatTree throws a non-Error object', async () => {
      mockFetchHatTree.mockRejectedValue('String error');

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to load hat tree' });
    });

    it('calls logger.error on fetchHatTree failure', async () => {
      const { logger } = await import('@/lib/logger');
      const mockLogger = logger as unknown as { error: ReturnType<typeof vi.fn> };
      mockFetchHatTree.mockRejectedValue(new Error('Network failure'));

      await GET(makeGetRequest('/api/hats/tree'));

      expect(mockLogger.error).toHaveBeenCalledWith('[hats/tree] Error:', expect.any(Error));
    });
  });

  describe('response shape consistency', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('never includes an error field in successful responses', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: null,
        totalHats: 0,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as Record<string, unknown>;

      expect(body).not.toHaveProperty('error');
      expect(res.status).toBe(200);
    });

    it('always returns NextResponse.json format', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: null,
        totalHats: 0,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));

      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('handles very large hat trees with deep nesting', async () => {
      const deepTree: HatTreeResult = {
        treeId: 1,
        root: {
          id: '1',
          prettyId: '1.0.0',
          details: '',
          label: 'Root',
          imageUri: '',
          maxSupply: 1,
          supply: 1,
          eligibility: '',
          toggle: '',
          isMutable: false,
          isActive: true,
          children: [],
          level: 0,
          wearers: [],
        },
        totalHats: 1000,
        timestamp: Date.now(),
      };
      mockFetchHatTree.mockResolvedValue(deepTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as HatTreeResult;

      expect(res.status).toBe(200);
      expect(body.totalHats).toBe(1000);
    });

    it('handles trees with empty wearers arrays', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: {
          id: '1',
          prettyId: '1.0.0',
          details: 'Root',
          label: 'ZAO',
          imageUri: '',
          maxSupply: 1,
          supply: 0,
          eligibility: '',
          toggle: '',
          isMutable: false,
          isActive: false,
          children: [],
          level: 0,
          wearers: [],
        },
        totalHats: 1,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as HatTreeResult;

      expect(res.status).toBe(200);
      expect(body.root?.wearers).toEqual([]);
    });

    it('handles trees with multiple wearers per hat', async () => {
      const mockTree: HatTreeResult = {
        treeId: 1,
        root: {
          id: '1',
          prettyId: '1.0.0',
          details: 'Root',
          label: 'ZAO',
          imageUri: '',
          maxSupply: 100,
          supply: 5,
          eligibility: '',
          toggle: '',
          isMutable: false,
          isActive: true,
          children: [],
          level: 0,
          wearers: [
            '0x1111111111111111111111111111111111111111',
            '0x2222222222222222222222222222222222222222',
            '0x3333333333333333333333333333333333333333',
            '0x4444444444444444444444444444444444444444',
            '0x5555555555555555555555555555555555555555',
          ],
        },
        totalHats: 1,
        timestamp: 1234567890,
      };
      mockFetchHatTree.mockResolvedValue(mockTree);

      const res = await GET(makeGetRequest('/api/hats/tree'));
      const body = (await res.json()) as HatTreeResult;

      expect(res.status).toBe(200);
      expect(body.root?.wearers).toHaveLength(5);
    });
  });
});
