import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_WALLET,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

// Mock fetch globally to intercept Alchemy API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { GET } from '@/app/api/members/nfts/route';

// ── Test data ────────────────────────────────────────────────────────────────

const mockAlchemyResponse = {
  ownedNfts: [
    {
      contract: {
        address: '0xcb80ef04da68667c9a4450013bdd69269842c883', // ZOUNZ
        name: 'ZOUNZ',
      },
      tokenId: '1',
      name: 'ZOUNZ #1',
      image: {
        cachedUrl: 'https://example.com/zounz1.png',
      },
      raw: {
        metadata: {
          name: 'ZOUNZ #1',
        },
      },
      metadata: {
        name: 'ZOUNZ #1',
      },
    },
    {
      contract: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Other Collection',
        openSeaMetadata: {
          collectionName: 'Other NFTs',
        },
      },
      tokenId: '42',
      name: 'Other NFT',
      image: {
        cachedUrl: 'https://example.com/other.png',
      },
      raw: {
        metadata: {
          name: 'Other NFT',
        },
      },
    },
    {
      contract: {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        name: 'No Image Collection',
      },
      tokenId: '100',
      name: 'No Image NFT',
      image: null,
      raw: {
        metadata: {
          name: 'No Image NFT',
        },
      },
      // Skip this because it has no image
    },
  ],
  pageKey: 'abc123',
};

const mockEmptyAlchemyResponse = {
  ownedNfts: [],
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/members/nfts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    delete process.env.ALCHEMY_API_KEY;
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when address is missing', async () => {
      const req = makeGetRequest('/api/members/nfts', {});
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address is invalid (missing 0x prefix)', async () => {
      const req = makeGetRequest('/api/members/nfts', {
        address: '1234567890abcdef1234567890abcdef12345678',
      });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address is too short', async () => {
      const req = makeGetRequest('/api/members/nfts', {
        address: '0x1234567890abcdef',
      });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address is too long', async () => {
      const req = makeGetRequest('/api/members/nfts', {
        address: '0x1234567890abcdef1234567890abcdef123456781234567890abcdef',
      });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address contains invalid hex chars', async () => {
      const req = makeGetRequest('/api/members/nfts', {
        address: '0x1234567890abcdef1234567890abcdef1234567G', // G is invalid hex
      });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('accepts valid checksummed addresses', async () => {
      process.env.ALCHEMY_API_KEY = 'test-key-123';
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockEmptyAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', {
        address: '0x1234567890ABCDEF1234567890ABCDEF12345678', // Checksum case
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Service configuration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 503 when ALCHEMY_API_KEY is not configured', async () => {
      delete process.env.ALCHEMY_API_KEY;

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBe('NFT service not configured');
    });
  });

  describe('Success path', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      process.env.ALCHEMY_API_KEY = 'test-key-123';
    });

    it('fetches NFTs from all three chains and returns them', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should have fetched from 3 chains
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify fetch URLs include the correct chains
      const calls = mockFetch.mock.calls;
      const urls = calls.map(([url]) => url as string);

      expect(urls[0]).toContain('eth-mainnet.g.alchemy.com');
      expect(urls[1]).toContain('base-mainnet.g.alchemy.com');
      expect(urls[2]).toContain('opt-mainnet.g.alchemy.com');

      // Each URL should include the address and API key
      urls.forEach((url) => {
        expect(url).toContain(`owner=${VALID_WALLET}`);
        expect(url).toContain('withMetadata=true');
        expect(url).toContain('pageSize=50');
        expect(url).toContain('excludeFilters');
        expect(url).toContain('SPAM');
        expect(url).toContain('test-key-123');
      });

      // Response shape
      expect(body.nfts).toBeDefined();
      expect(body.address).toBe(VALID_WALLET);
      expect(body.count).toBeDefined();
    });

    it('filters out NFTs without images', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      // Should only include 2 NFTs (not the one without an image)
      // 3 chains × 2 NFTs per chain = 6 total (the one without image is skipped per chain)
      expect(body.nfts.length).toBeGreaterThan(0);

      // No NFT should be missing an image
      body.nfts.forEach((nft: { imageUrl: unknown }) => {
        expect(nft.imageUrl).toBeTruthy();
      });
    });

    it('sorts NFTs with ZOUNZ first, then by collection name', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      // ZOUNZ should come first
      const zounzNfts = body.nfts.filter((nft: { isZounz: boolean }) => nft.isZounz === true);
      const nonZounzNfts = body.nfts.filter((nft: { isZounz: boolean }) => nft.isZounz === false);

      if (zounzNfts.length > 0 && nonZounzNfts.length > 0) {
        const lastZounzIndex = body.nfts.findIndex(
          (nft: { isZounz: boolean }) =>
            zounzNfts.includes(nft) && body.nfts[body.nfts.indexOf(nft) + 1]?.isZounz === false,
        );
        const firstNonZounzIndex = body.nfts.findIndex(
          (nft: { isZounz: boolean }) => nft.isZounz === false,
        );
        expect(lastZounzIndex).toBeLessThan(firstNonZounzIndex);
      }
    });

    it('includes cache control headers in response', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockEmptyAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const cacheControl = res.headers.get('Cache-Control');
      expect(cacheControl).toBe('public, s-maxage=300, stale-while-revalidate=60');
    });

    it('returns empty NFT array when chains return no NFTs', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockEmptyAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      expect(body.nfts).toEqual([]);
      expect(body.address).toBe(VALID_WALLET);
      expect(body.count).toBe(0);
    });

    it('handles failed fetch calls gracefully (Promise.allSettled)', async () => {
      // First call fails, second and third succeed
      const successResponse = new Response(JSON.stringify(mockAlchemyResponse), {
        status: 200,
      });
      const errorResponse = new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
      });

      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse)
        .mockResolvedValueOnce(successResponse);

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should still have NFTs from the two successful chains
      expect(body.nfts.length).toBeGreaterThan(0);
    });

    it('returns correct NFT structure with all required fields', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mockAlchemyResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      if (body.nfts.length > 0) {
        const nft = body.nfts[0];
        expect(nft).toHaveProperty('name');
        expect(nft).toHaveProperty('collection');
        expect(nft).toHaveProperty('imageUrl');
        expect(nft).toHaveProperty('chain');
        expect(nft).toHaveProperty('contractAddress');
        expect(nft).toHaveProperty('tokenId');
        expect(nft).toHaveProperty('url');
        expect(nft).toHaveProperty('isZounz');

        expect(['eth', 'base', 'optimism']).toContain(nft.chain);
        expect(typeof nft.name).toBe('string');
        expect(typeof nft.collection).toBe('string');
        expect(typeof nft.contractAddress).toBe('string');
        expect(typeof nft.tokenId).toBe('string');
        expect(typeof nft.isZounz).toBe('boolean');
      }
    });

    it('correctly identifies ZOUNZ tokens by contract address', async () => {
      const zounzResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0xcb80ef04da68667c9a4450013bdd69269842c883', // Exact ZOUNZ address
              name: 'ZOUNZ',
            },
            tokenId: '999',
            name: 'ZOUNZ Token',
            image: {
              cachedUrl: 'https://example.com/zounz.png',
            },
            raw: { metadata: { name: 'ZOUNZ Token' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(new Response(JSON.stringify(zounzResponse), { status: 200 }));

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();
      const zounzNft = body.nfts.find(
        (nft: { contractAddress: string }) =>
          nft.contractAddress === '0xcb80ef04da68667c9a4450013bdd69269842c883',
      );

      expect(zounzNft).toBeDefined();
      expect(zounzNft.isZounz).toBe(true);
    });

    it('generates correct marketplace URLs for zora NFTs', async () => {
      const zoraResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0x7c0ef9eda74abb14a8b9eda23e36af33d39fdfa8',
              name: 'Zora NFT Creator',
            },
            tokenId: '123',
            name: 'Zora NFT',
            image: {
              cachedUrl: 'https://example.com/zora.png',
            },
            raw: { metadata: { name: 'Zora NFT' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(new Response(JSON.stringify(zoraResponse), { status: 200 }));

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();
      const zoraNft = body.nfts[0];

      expect(zoraNft.url).toContain('zora.co');
    });

    it('generates correct marketplace URLs for opensea NFTs', async () => {
      const openseaResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              name: 'Generic NFT',
            },
            tokenId: '456',
            name: 'Generic NFT',
            image: {
              cachedUrl: 'https://example.com/generic.png',
            },
            raw: { metadata: { name: 'Generic NFT' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(new Response(JSON.stringify(openseaResponse), { status: 200 }));

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();
      const genericNft = body.nfts[0];

      expect(genericNft.url).toContain('opensea.io');
      expect(genericNft.url).toContain('0x1234567890abcdef1234567890abcdef12345678');
      expect(genericNft.url).toContain('456');
    });

    it('uses correct chain name in opensea URL (ethereum vs eth)', async () => {
      // For base chain
      const baseResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              name: 'Generic NFT',
            },
            tokenId: '789',
            name: 'Generic NFT',
            image: {
              cachedUrl: 'https://example.com/generic.png',
            },
            raw: { metadata: { name: 'Generic NFT' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(new Response(JSON.stringify(baseResponse), { status: 200 }));

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      // Find NFTs by chain
      const baseNfts = body.nfts.filter((nft: { chain: string }) => nft.chain === 'base');
      const ethNfts = body.nfts.filter((nft: { chain: string }) => nft.chain === 'eth');

      baseNfts.forEach((nft: { url: string }) => {
        expect(nft.url).toContain('opensea.io/assets/base');
      });

      ethNfts.forEach((nft: { url: string }) => {
        expect(nft.url).toContain('opensea.io/assets/ethereum');
      });
    });

    it('handles missing image metadata gracefully', async () => {
      const mixedResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              name: 'Collection A',
            },
            tokenId: '1',
            name: 'NFT 1',
            image: {
              cachedUrl: 'https://example.com/1.png',
            },
            raw: { metadata: {} },
          },
          {
            contract: {
              address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
              name: 'Collection B',
            },
            tokenId: '2',
            name: 'NFT 2',
            image: {
              thumbnailUrl: 'https://example.com/2-thumb.png',
            },
            raw: { metadata: { image: 'https://example.com/2-meta.png' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(new Response(JSON.stringify(mixedResponse), { status: 200 }));

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      // All returned NFTs should have an image
      body.nfts.forEach((nft: { imageUrl: string | null }) => {
        expect(nft.imageUrl).toBeTruthy();
      });
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      process.env.ALCHEMY_API_KEY = 'test-key-123';
    });

    it('handles NFT with missing tokenId', async () => {
      const missingTokenIdResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              name: 'Collection',
            },
            tokenId: null,
            name: 'NFT',
            image: {
              cachedUrl: 'https://example.com/nft.png',
            },
            raw: { metadata: { name: 'NFT' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(missingTokenIdResponse), { status: 200 }),
      );

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      if (body.nfts.length > 0) {
        const nft = body.nfts[0];
        // Should default tokenId to '0'
        expect(nft.tokenId).toBe('0');
      }
    });

    it('normalizes contract addresses to lowercase', async () => {
      const mixedCaseResponse = {
        ownedNfts: [
          {
            contract: {
              address: '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD', // Uppercase
              name: 'Collection',
            },
            tokenId: '1',
            name: 'NFT',
            image: {
              cachedUrl: 'https://example.com/nft.png',
            },
            raw: { metadata: { name: 'NFT' } },
          },
        ],
      };

      mockFetch.mockResolvedValue(new Response(JSON.stringify(mixedCaseResponse), { status: 200 }));

      const req = makeGetRequest('/api/members/nfts', { address: VALID_WALLET });
      const res = await GET(req);

      const body = await res.json();

      if (body.nfts.length > 0) {
        const nft = body.nfts[0];
        expect(nft.contractAddress).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
      }
    });
  });
});
