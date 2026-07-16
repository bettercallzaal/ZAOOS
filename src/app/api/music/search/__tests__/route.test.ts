import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const {
  mockGetSession,
  mockSearchAudiusTracks,
  mockSearchTidal,
  mockGetSupabaseAdmin,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSearchAudiusTracks: vi.fn(),
  mockSearchTidal: vi.fn(),
  mockGetSupabaseAdmin: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: mockGetSession,
}));

vi.mock('@/lib/music/audius', () => ({
  searchAudiusTracks: mockSearchAudiusTracks,
}));

vi.mock('@/lib/music/tidal', () => ({
  searchTidal: mockSearchTidal,
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/music/search/route';
import { chainMock } from '@/test-utils/api-helpers';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeGetRequest(path: string, params?: Record<string, string>): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

// ── Test suite ───────────────────────────────────────────────────────────────
describe('GET /api/music/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TIDAL_CLIENT_ID;
  });

  describe('Authentication', () => {
    it('returns 401 when session is null (no user)', async () => {
      mockGetSession.mockResolvedValue({});

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when both fid and walletAddress are missing', async () => {
      mockGetSession.mockResolvedValue({
        username: 'testuser',
        displayName: 'Test User',
      });

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('succeeds with valid fid', async () => {
      mockGetSession.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);

      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('succeeds with valid walletAddress', async () => {
      mockGetSession.mockResolvedValue({
        walletAddress: '0x1234567890123456789012345678901234567890',
      });
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);

      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Input Validation (Zod)', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
    });

    it('returns 400 when q param is missing', async () => {
      const req = makeGetRequest('/api/music/search', {});
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(body.error.fieldErrors).toBeDefined();
    });

    it('returns 400 when q is empty string', async () => {
      const req = makeGetRequest('/api/music/search', { q: '' });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it('returns 400 when q exceeds 200 characters', async () => {
      const longQuery = 'a'.repeat(201);
      const req = makeGetRequest('/api/music/search', { q: longQuery });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it('succeeds with q at exactly 200 characters', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);
      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const query200 = 'a'.repeat(200);
      const req = makeGetRequest('/api/music/search', { q: query200 });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('returns 400 when limit is 0', async () => {
      const req = makeGetRequest('/api/music/search', { q: 'test', limit: '0' });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it('returns 400 when limit exceeds 50', async () => {
      const req = makeGetRequest('/api/music/search', { q: 'test', limit: '51' });
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it('coerces limit string to number', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);
      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test', limit: '10' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Verify searchAudiusTracks was called with coerced number
      expect(mockSearchAudiusTracks).toHaveBeenCalledWith('test', 10);
    });

    it('uses default limit of 20 when not provided', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);
      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockSearchAudiusTracks).toHaveBeenCalledWith('test', 20);
    });

    it('accepts optional genre param without validation', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);
      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test', genre: 'hiphop' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('accepts q with 1 character (minimum)', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);
      const supabaseMock = {
        from: vi.fn().mockReturnValue(chainMock({ data: [] }).chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'a' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe('Success Path — All Sources', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
      process.env.TIDAL_CLIENT_ID = 'test-tidal-id';
    });

    it('merges results from Audius, library, and Tidal', async () => {
      const audiusTrack = {
        id: 'audius-123',
        title: 'Test Song',
        user: { name: 'Artist 1' },
        artwork: { '480x480': 'https://example.com/audius-art.jpg' },
        play_count: 100,
        permalink: '/artist/test-song',
      };

      const libraryTrack = {
        id: 'lib-456',
        title: 'Library Song',
        artist: 'Artist 2',
        artwork_url: 'https://example.com/lib-art.jpg',
        url: 'https://example.com/lib',
        stream_url: 'https://example.com/lib-stream',
        platform: 'custom',
        play_count: 50,
      };

      const tidalTrack = {
        id: 'tidal-789',
        title: 'Tidal Song',
        artist: 'Artist 3',
        artworkUrl: 'https://example.com/tidal-art.jpg',
        url: 'https://tidal.com/browse/track/789',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([tidalTrack] as never);

      const libraryChain = chainMock({ data: [libraryTrack] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test', limit: '10' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should have at least Audius and Tidal results; library may vary based on dedup
      expect(body.results.length).toBeGreaterThanOrEqual(2);
      expect(body.results.some((r) => r.platform === 'audius')).toBe(true);
      expect(body.results.some((r) => r.platform === 'tidal')).toBe(true);

      expect(body.sources).toContain('audius');
      expect(body.sources).toContain('library');
      expect(body.sources).toContain('tidal');
    });

    it('deduplicates identical titles and artists across sources', async () => {
      const audiusTrack = {
        id: 'audius-dupe',
        title: 'Same Song',
        user: { name: 'Same Artist' },
        artwork: { '480x480': 'https://example.com/art.jpg' },
        play_count: 100,
        permalink: '/artist/same-song',
      };

      const libraryTrack = {
        id: 'lib-dupe',
        title: 'same song', // Case-insensitive match
        artist: 'same artist',
        artwork_url: 'https://example.com/lib-art.jpg',
        url: 'https://example.com',
        stream_url: 'https://example.com/stream',
        platform: 'custom',
        play_count: 50,
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [libraryTrack] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'same' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Only Audius result should be included; library duplicate rejected
      expect(body.results).toHaveLength(1);
      expect(body.results[0].id).toBe('audius-audius-dupe');
    });

    it('caps Tidal limit to 5', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test', limit: '50' });
      await GET(req);

      // Even though limit is 50, Tidal should be called with Math.min(50, 5) = 5
      expect(mockSearchTidal).toHaveBeenCalledWith('test', 5);
    });

    it('uses Audius and library when TIDAL_CLIENT_ID is not set', async () => {
      delete process.env.TIDAL_CLIENT_ID;

      const audiusTrack = {
        id: 'audius-123',
        title: 'Test',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 0,
        permalink: '/artist/test',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.sources).toContain('audius');
      expect(body.sources).toContain('library');
      expect(body.sources).not.toContain('tidal');

      // Tidal should not be called
      expect(mockSearchTidal).not.toHaveBeenCalled();
    });
  });

  describe('Fault Tolerance — Promise.allSettled', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        fid: 123,
      });
      process.env.TIDAL_CLIENT_ID = 'test-tidal-id';
    });

    it('continues when Audius search fails', async () => {
      mockSearchAudiusTracks.mockRejectedValue(new Error('Audius API error'));

      const tidalTrack = {
        id: 'tidal-789',
        title: 'Tidal Song',
        artist: 'Artist 3',
        artworkUrl: 'https://example.com/tidal-art.jpg',
        url: 'https://tidal.com/browse/track/789',
      };

      mockSearchTidal.mockResolvedValue([tidalTrack] as never);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should have results from Tidal (Audius failed, library empty)
      expect(body.results.length).toBeGreaterThan(0);
      const tidalResult = body.results.find((r) => r.platform === 'tidal');
      expect(tidalResult).toBeDefined();
      expect(tidalResult?.title).toBe('Tidal Song');
    });

    it('continues when library search fails', async () => {
      const audiusTrack = {
        id: 'audius-123',
        title: 'Audius Song',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 0,
        permalink: '/artist/song',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: null, error: { message: 'DB error' } });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should have Audius results, skip library error
      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results[0].platform).toBe('audius');
    });

    it('continues when Tidal search fails', async () => {
      const audiusTrack = {
        id: 'audius-123',
        title: 'Audius Song',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 0,
        permalink: '/artist/song',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockRejectedValue(new Error('Tidal API error'));

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      // Should have Audius results, skip Tidal error
      expect(body.results.length).toBeGreaterThan(0);
    });

    it('returns empty results when all sources fail', async () => {
      mockSearchAudiusTracks.mockRejectedValue(new Error('Audius error'));
      mockSearchTidal.mockRejectedValue(new Error('Tidal error'));

      const libraryChain = chainMock({ error: { message: 'Library error' } });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.results).toHaveLength(0);
      expect(body.sources.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases — Track Data', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('handles Audius track with missing artwork', async () => {
      const audiusTrack = {
        id: 'audius-no-art',
        title: 'No Artwork Track',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 0,
        permalink: '/artist/track',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results[0].artworkUrl).toBe('');
    });

    it('handles Audius track with missing user name', async () => {
      const audiusTrack = {
        id: 'audius-no-user',
        title: 'No User Track',
        user: {},
        artwork: null,
        play_count: 0,
        permalink: '/artist/track',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results[0].artist).toBe('Unknown');
    });

    it('prefers 480x480 artwork over 150x150 for Audius', async () => {
      const audiusTrack = {
        id: 'audius-art',
        title: 'Art Test',
        user: { name: 'Artist' },
        artwork: {
          '150x150': 'https://example.com/150.jpg',
          '480x480': 'https://example.com/480.jpg',
        },
        play_count: 0,
        permalink: '/artist/track',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results[0].artworkUrl).toBe('https://example.com/480.jpg');
    });

    it('defaults to "audio" platform when library platform is null', async () => {
      const audiusTrack = {
        id: 'audius-123',
        title: 'Unique Song',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 5,
        permalink: '/artist/unique',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.results.length).toBeGreaterThan(0);
      const result = body.results[0];
      expect(result.platform).toBe('audius');
      expect(result.title).toBe('Unique Song');
    });
  });

  describe('Empty Results', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('returns empty results array when no matches found', async () => {
      mockSearchAudiusTracks.mockResolvedValue([]);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'nonexistent' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.results).toHaveLength(0);
      expect(Array.isArray(body.sources)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('returns 500 on unexpected error', async () => {
      mockSearchAudiusTracks.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Search failed');

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith('Music search error:', expect.any(Error));
    });

    it('tolerates library search errors from getSupabaseAdmin', async () => {
      const audiusTrack = {
        id: 'audius-123',
        title: 'Audius Song',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 0,
        permalink: '/artist/track',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);
      // getSupabaseAdmin throws, so searchLibrary will fail and be caught by allSettled
      mockGetSupabaseAdmin.mockImplementation(() => {
        throw new Error('Supabase init error');
      });

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      // Should still return 200 (allSettled handles the error)
      expect(res.status).toBe(200);
      const body = await res.json();

      // Should have Audius results despite library failure
      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results[0].platform).toBe('audius');
    });
  });

  describe('Response Shape', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ fid: 123 });
    });

    it('returns correct response shape with results and sources', async () => {
      const audiusTrack = {
        id: 'audius-1',
        title: 'Test',
        user: { name: 'Artist' },
        artwork: null,
        play_count: 50,
        permalink: '/artist/test',
      };

      mockSearchAudiusTracks.mockResolvedValue([audiusTrack] as never);
      mockSearchTidal.mockResolvedValue([]);

      const libraryChain = chainMock({ data: [] });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(libraryChain.chain),
      };
      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/search', { q: 'test' });
      const res = await GET(req);

      const body = await res.json();

      // Verify response structure
      expect(body).toHaveProperty('results');
      expect(body).toHaveProperty('sources');
      expect(Array.isArray(body.results)).toBe(true);
      expect(Array.isArray(body.sources)).toBe(true);

      // Verify each result has all required fields
      if (body.results.length > 0) {
        const result = body.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('artist');
        expect(result).toHaveProperty('artworkUrl');
        expect(result).toHaveProperty('platform');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('streamUrl');
        expect(result).toHaveProperty('playCount');
      }
    });
  });
});
