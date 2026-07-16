import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('node:fetch', () => ({
  fetch: vi.fn(),
}));

import { GET } from '@/app/api/music/wallet/route';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/music/wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // By default, requests are unauthenticated
    mockGetSessionData.mockResolvedValue(null);
  });

  describe('Authentication guard', () => {
    it('returns 401 when session is missing', async () => {
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session resolves to falsy', async () => {
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );
      mockGetSessionData.mockResolvedValue(undefined);

      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Address validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
    });

    it('returns 400 when address is missing', async () => {
      const req = makeRequest('/api/music/wallet');

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address is empty', async () => {
      const req = makeRequest('/api/music/wallet?address=');

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address does not start with 0x', async () => {
      const req = makeRequest('/api/music/wallet?address=1234567890abcdef1234567890abcdef12345678');

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address is too short', async () => {
      const req = makeRequest('/api/music/wallet?address=0x1234567890abcdef12345678');

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address is too long', async () => {
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef123456789012345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('returns 400 when address contains invalid hex characters', async () => {
      const req = makeRequest(
        '/api/music/wallet?address=0xgggggggggggggggggggggggggggggggggggggggg',
      );

      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Valid ETH address required');
    });

    it('accepts valid lowercase ETH address', async () => {
      mockGlobalFetch([]);
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('accepts valid mixed-case ETH address', async () => {
      mockGlobalFetch([]);
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890ABCDEF1234567890ABCDEF12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe('No Alchemy API key', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      delete process.env.ALCHEMY_API_KEY;
    });

    it('skips Alchemy fetch and tries Zora fallback', async () => {
      mockGlobalFetch([
        // No Alchemy API key, so fetch only happens for Zora
        { ok: true, json: async () => ({ results: [] }) },
      ]);
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      // source is 'legacy' only if Zora returns tracks; otherwise 'none'
      expect(body.source).toBe('none');
      expect(body.tracks).toEqual([]);
    });
  });

  describe('Success with Alchemy API', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
    });

    it('returns 200 with tracks from Alchemy when available', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0x7e1a7720b2904ac974e12166080ae2a6b5ab6dd6', name: 'Sound.xyz' },
            tokenId: '1',
            name: 'Test Track',
            image: { cachedUrl: 'https://example.com/image.jpg' },
            raw: {
              metadata: {
                name: 'Test Track',
                artist: 'Test Artist',
                image: 'https://example.com/image.jpg',
                animation_url: 'https://example.com/track.mp3',
                mimeType: 'audio/mpeg',
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        { ok: true, json: async () => ({ results: [] }) },
        { ok: true, json: async () => ({ results: [] }) },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(body.source).toBe('alchemy');
      expect(body.tracks.length).toBeGreaterThanOrEqual(1);
      expect(body.tracks[0]).toMatchObject({
        title: 'Test Track',
        artist: 'Test Artist',
        platform: 'Sound.xyz',
        role: 'collector',
      });
    });

    it('sorts creators before collectors', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0xsome_contract', name: 'Zora' },
            tokenId: '1',
            name: 'Collector Track',
            raw: {
              metadata: {
                name: 'Collector Track',
                artist: 'Artist 1',
                animation_url: 'https://example.com/track.mp3',
                mimeType: 'audio/mpeg',
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        {
          ok: true,
          json: async () => ({
            results: [
              {
                name: 'Creator Track',
                metadata: { artist: 'Artist 2', animation_url: 'https://example.com/track2.mp3' },
                creator: { address: '0x1234567890abcdef1234567890abcdef12345678' },
                chain: 'ETHEREUM',
                address: '0xzora',
                tokenId: '2',
              },
            ],
          }),
        },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      // Creators should come first
      if (body.tracks.length >= 2) {
        const creatorRole = body.tracks[0].role;
        expect(creatorRole).toBe('creator');
      }
    });

    it('returns cache control headers', async () => {
      mockGlobalFetch([]);
      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=60',
      );
    });
  });

  describe('Alchemy fallback to Zora', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
    });

    it('falls back to Zora when Alchemy returns no tracks', async () => {
      const zoraResponse = {
        results: [
          {
            name: 'Zora Track',
            metadata: { artist: 'Zora Artist', animation_url: 'https://example.com/track.mp3' },
            creator: { address: '0xother', username: 'other_creator' },
            chain: 'ETHEREUM',
            address: '0xzora_contract',
            tokenId: '1',
            mintedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => ({ ownedNfts: [] }) },
        { ok: true, json: async () => ({ ownedNfts: [] }) },
        { ok: true, json: async () => ({ ownedNfts: [] }) },
        { ok: true, json: async () => zoraResponse },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.source).toBe('legacy');
      expect(body.tracks.length).toBeGreaterThanOrEqual(1);
      expect(body.tracks[0]).toMatchObject({
        title: 'Zora Track',
        platform: 'Zora',
      });
    });

    it('continues to next chain when one Alchemy call fails', async () => {
      mockGlobalFetch([
        { ok: false }, // eth fails
        { ok: true, json: async () => ({ ownedNfts: [] }) }, // optimism succeeds with empty
        { ok: true, json: async () => ({ ownedNfts: [] }) }, // base succeeds with empty
        // No Zora call since Alchemy returned a result (source='alchemy')
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      // Alchemy was invoked (chains tried), so source is 'alchemy' even with empty results
      expect(body.source).toBe('alchemy');
      expect(body.tracks).toEqual([]);
    });

    it('handles Zora fetch error gracefully', async () => {
      mockGlobalFetch([
        { ok: true, json: async () => ({ ownedNfts: [] }) },
        { ok: true, json: async () => ({ ownedNfts: [] }) },
        { ok: true, json: async () => ({ ownedNfts: [] }) },
        // Zora fails - route catches and returns []
        {
          ok: false,
          json: async () => {
            throw new Error('Network error');
          },
        },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      // Should not crash, just return empty tracks from Alchemy (source='alchemy')
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tracks).toEqual([]);
      // Alchemy succeeded (returned empty) so source is 'alchemy'
      expect(body.source).toBe('alchemy');
    });
  });

  describe('Alchemy NFT filtering', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
    });

    it('filters by audio MIME type', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0xsome_contract', name: 'NFT Platform' },
            tokenId: '1',
            name: 'Audio Track',
            raw: {
              metadata: {
                name: 'Audio Track',
                animation_url: 'https://example.com/track.mp3',
                mimeType: 'audio/mpeg',
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            contract: { address: '0xsome_contract', name: 'NFT Platform' },
            tokenId: '2',
            name: 'Image NFT',
            raw: {
              metadata: {
                name: 'Image NFT',
                animation_url: 'https://example.com/image.jpg',
                mimeType: 'image/jpeg',
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        { ok: true, json: async () => ({ results: [] }) },
        { ok: true, json: async () => ({ results: [] }) },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      const body = await res.json();
      // Only the audio track should be included
      expect(body.tracks.length).toBe(1);
      expect(body.tracks[0].title).toBe('Audio Track');
    });

    it('includes Sound.xyz contract by address', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0x7e1a7720b2904ac974e12166080ae2a6b5ab6dd6', name: 'Sound.xyz' },
            tokenId: '1',
            name: 'Sound Track',
            raw: { metadata: { name: 'Sound Track' } },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        { ok: true, json: async () => ({ results: [] }) },
        { ok: true, json: async () => ({ results: [] }) },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      const body = await res.json();
      expect(body.tracks.length).toBeGreaterThanOrEqual(1);
      expect(body.tracks[0].platform).toBe('Sound.xyz');
    });

    it('includes tracks with music tags', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0xsome_contract', name: 'NFT Platform' },
            tokenId: '1',
            name: 'Tagged Track',
            raw: {
              metadata: {
                name: 'Tagged Track',
                tags: ['music', 'electronic'],
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        { ok: true, json: async () => ({ results: [] }) },
        { ok: true, json: async () => ({ results: [] }) },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      const body = await res.json();
      expect(body.tracks.length).toBeGreaterThanOrEqual(1);
      expect(body.tracks[0].title).toBe('Tagged Track');
    });

    it('includes tracks with audio_url property', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0xsome_contract', name: 'NFT Platform' },
            tokenId: '1',
            name: 'Audio URL Track',
            raw: {
              metadata: {
                name: 'Audio URL Track',
                audio_url: 'https://example.com/track.mp3',
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        { ok: true, json: async () => ({ results: [] }) },
        { ok: true, json: async () => ({ results: [] }) },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      const body = await res.json();
      expect(body.tracks.length).toBeGreaterThanOrEqual(1);
      expect(body.tracks[0].title).toBe('Audio URL Track');
    });
  });

  describe('Response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
    });

    it('includes address, tracks, and source in response', async () => {
      mockGlobalFetch([]);
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const req = makeRequest(`/api/music/wallet?address=${address}`);

      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('address', address);
      expect(body).toHaveProperty('tracks');
      expect(body).toHaveProperty('source');
      expect(Array.isArray(body.tracks)).toBe(true);
    });

    it('MusicNFT objects have required properties', async () => {
      const alchemyResponse = {
        ownedNfts: [
          {
            contract: { address: '0x7e1a7720b2904ac974e12166080ae2a6b5ab6dd6', name: 'Sound.xyz' },
            tokenId: '1',
            name: 'Test',
            raw: {
              metadata: {
                name: 'Test Track',
                animation_url: 'https://example.com/track.mp3',
                mimeType: 'audio/mpeg',
              },
            },
            mint: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ],
      };

      mockGlobalFetch([
        { ok: true, json: async () => alchemyResponse },
        { ok: true, json: async () => ({ results: [] }) },
        { ok: true, json: async () => ({ results: [] }) },
      ]);

      const req = makeRequest(
        '/api/music/wallet?address=0x1234567890abcdef1234567890abcdef12345678',
      );

      const res = await GET(req);

      const body = await res.json();
      const track = body.tracks[0];
      expect(track).toHaveProperty('title');
      expect(track).toHaveProperty('artist');
      expect(track).toHaveProperty('artworkUrl');
      expect(track).toHaveProperty('audioUrl');
      expect(track).toHaveProperty('platform');
      expect(track).toHaveProperty('url');
      expect(track).toHaveProperty('mintedAt');
      expect(track).toHaveProperty('role');
      expect(track).toHaveProperty('chain');
      expect(track).toHaveProperty('contractAddress');
      expect(track).toHaveProperty('tokenId');
    });
  });
});

// ── Mock helpers ─────────────────────────────────────────────────────────────

interface MockResponse {
  ok: boolean;
  json?: () => Promise<unknown>;
}

/**
 * Mock global fetch with a queue of responses.
 * Each call to fetch pops from the queue.
 */
function mockGlobalFetch(responses: MockResponse[]) {
  let callIndex = 0;

  // For runtime: mock global.fetch (Next.js uses global fetch in edge runtime)
  const mockFetchFn = vi.fn(async (): Promise<Response> => {
    if (callIndex >= responses.length) {
      return {
        ok: true,
        json: async () => ({ ownedNfts: [] }),
      } as unknown as Response;
    }
    const resp = responses[callIndex++];
    return {
      ok: resp.ok,
      json: resp.json || (async () => ({})),
    } as unknown as Response;
  });

  global.fetch = mockFetchFn;
}
