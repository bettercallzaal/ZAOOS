import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const {
  mockGetSessionData,
  mockGetSupabaseAdmin,
  mockResolveMusicLinks,
  mockBuildUniversalCard,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetSupabaseAdmin: vi.fn(),
  mockResolveMusicLinks: vi.fn(),
  mockBuildUniversalCard: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

vi.mock('@/lib/music/songlink', () => ({
  resolveMusicLinks: mockResolveMusicLinks,
  buildUniversalCard: mockBuildUniversalCard,
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitError';
    }
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/music/resolve/route';
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
describe('GET /api/music/resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/123abc',
      });

      const res = await GET(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
    });

    it('returns 400 when url param is missing', async () => {
      const req = makeGetRequest('/api/music/resolve', {});

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(body.details.url).toBeDefined();
    });

    it('returns 400 when url is not a valid URL', async () => {
      const req = makeGetRequest('/api/music/resolve', {
        url: 'not-a-url',
      });

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details.url).toBeDefined();
    });

    it('returns 400 when url is not http/https', async () => {
      const req = makeGetRequest('/api/music/resolve', {
        url: 'ftp://example.com/track',
      });

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details.url).toBeDefined();
    });

    it('returns 400 when url exceeds 2048 characters', async () => {
      const longUrl = `https://${'a'.repeat(2050)}`;
      const req = makeGetRequest('/api/music/resolve', {
        url: longUrl,
      });

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details.url).toBeDefined();
    });
  });

  describe('Success Path — Cache Hit', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
    });

    it('returns cached card when available', async () => {
      const cachedCard = {
        title: 'Song Name',
        artist: 'Artist Name',
        thumbnail: 'https://example.com/thumb.jpg',
        pageUrl: 'https://song.link/abc123',
        platforms: [
          {
            platform: 'spotify',
            label: 'Spotify',
            url: 'https://open.spotify.com/track/123',
            color: '#1DB954',
          },
        ],
      };

      // Mock cache hit: maybeSingle returns the cached data
      const cacheChain = chainMock({
        data: {
          card_data: cachedCard,
          expires_at: new Date(Date.now() + 1000000).toISOString(),
        },
      });

      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/123abc',
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(cachedCard);
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');

      // Verify cache was queried
      expect(supabaseMock.from).toHaveBeenCalledWith('music_link_cache');

      // Verify resolveMusicLinks was NOT called (cache hit)
      expect(mockResolveMusicLinks).not.toHaveBeenCalled();
    });

    it('skips cache silently if cache table does not exist (error 42P01)', async () => {
      const songlinkResponse = {
        entityUniqueId: 'sp-123',
        pageUrl: 'https://song.link/abc123',
        entitiesByUniqueId: {
          'sp-123': {
            id: 'sp-123',
            title: 'Song Name',
            artistName: 'Artist Name',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        },
        linksByPlatform: {
          spotify: {
            url: 'https://open.spotify.com/track/123',
            entityUniqueId: 'sp-123',
          },
        },
      };

      const builtCard = {
        title: 'Song Name',
        artist: 'Artist Name',
        thumbnail: 'https://example.com/thumb.jpg',
        pageUrl: 'https://song.link/abc123',
        platforms: [
          {
            platform: 'spotify',
            label: 'Spotify',
            url: 'https://open.spotify.com/track/123',
            color: '#1DB954',
          },
        ],
      };

      // Mock cache miss with error (table doesn't exist)
      const cacheChain = chainMock({
        error: { code: '42P01', message: 'relation "music_link_cache" does not exist' },
      });

      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockResolvedValue(songlinkResponse);
      mockBuildUniversalCard.mockReturnValue(builtCard);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/123abc',
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(builtCard);

      // Verify resolveMusicLinks was called (cache miss)
      expect(mockResolveMusicLinks).toHaveBeenCalledWith('https://open.spotify.com/track/123abc');
      expect(mockBuildUniversalCard).toHaveBeenCalledWith(songlinkResponse);
    });
  });

  describe('Success Path — Cache Miss', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
    });

    it('resolves via Songlink API and returns card', async () => {
      const songlinkResponse = {
        entityUniqueId: 'sp-456',
        pageUrl: 'https://song.link/def456',
        entitiesByUniqueId: {
          'sp-456': {
            id: 'sp-456',
            title: 'New Song',
            artistName: 'New Artist',
            thumbnailUrl: 'https://example.com/new-thumb.jpg',
          },
        },
        linksByPlatform: {
          spotify: {
            url: 'https://open.spotify.com/track/456',
            entityUniqueId: 'sp-456',
          },
          appleMusic: {
            url: 'https://music.apple.com/us/album/456',
            entityUniqueId: 'sp-456',
          },
        },
      };

      const builtCard = {
        title: 'New Song',
        artist: 'New Artist',
        thumbnail: 'https://example.com/new-thumb.jpg',
        pageUrl: 'https://song.link/def456',
        platforms: [
          {
            platform: 'spotify',
            label: 'Spotify',
            url: 'https://open.spotify.com/track/456',
            color: '#1DB954',
          },
          {
            platform: 'appleMusic',
            label: 'Apple Music',
            url: 'https://music.apple.com/us/album/456',
            color: '#FA243C',
          },
        ],
      };

      // Mock cache miss (no data returned)
      const cacheChain = chainMock({ data: null });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockResolvedValue(songlinkResponse);
      mockBuildUniversalCard.mockReturnValue(builtCard);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/456abc',
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(builtCard);
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');

      // Verify the chain methods were called correctly
      expect(cacheChain.chain.select).toHaveBeenCalledWith('card_data, expires_at');
      expect(cacheChain.chain.eq).toHaveBeenCalledWith(
        'url',
        'https://open.spotify.com/track/456abc',
      );
      expect(cacheChain.chain.maybeSingle).toHaveBeenCalled();
    });

    it('skips cache gracefully if cache read fails', async () => {
      const songlinkResponse = {
        entityUniqueId: 'sp-789',
        pageUrl: 'https://song.link/ghi789',
        entitiesByUniqueId: {
          'sp-789': {
            id: 'sp-789',
            title: 'Error Test Song',
            artistName: 'Test Artist',
            thumbnailUrl: 'https://example.com/test.jpg',
          },
        },
        linksByPlatform: {},
      };

      const builtCard = {
        title: 'Error Test Song',
        artist: 'Test Artist',
        thumbnail: 'https://example.com/test.jpg',
        pageUrl: 'https://song.link/ghi789',
        platforms: [],
      };

      // Mock cache read error
      const cacheChain = chainMock({
        error: { message: 'Connection timeout' },
      });

      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockResolvedValue(songlinkResponse);
      mockBuildUniversalCard.mockReturnValue(builtCard);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/789abc',
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(builtCard);

      // Verify warning was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[music/resolve] cache read error:',
        'Connection timeout',
      );
    });

    it('returns card even if cache write fails (fire-and-forget)', async () => {
      const songlinkResponse = {
        entityUniqueId: 'sp-999',
        pageUrl: 'https://song.link/jkl999',
        entitiesByUniqueId: {
          'sp-999': {
            id: 'sp-999',
            title: 'Cache Fail Song',
            artistName: 'Cache Artist',
            thumbnailUrl: 'https://example.com/cache.jpg',
          },
        },
        linksByPlatform: {
          spotify: {
            url: 'https://open.spotify.com/track/999',
            entityUniqueId: 'sp-999',
          },
        },
      };

      const builtCard = {
        title: 'Cache Fail Song',
        artist: 'Cache Artist',
        thumbnail: 'https://example.com/cache.jpg',
        pageUrl: 'https://song.link/jkl999',
        platforms: [
          {
            platform: 'spotify',
            label: 'Spotify',
            url: 'https://open.spotify.com/track/999',
            color: '#1DB954',
          },
        ],
      };

      // Mock cache read miss
      const cacheReadChain = chainMock({ data: null });

      // Mock cache write error
      const cacheWriteChain = chainMock({
        error: { message: 'Write failed' },
      });

      const supabaseMock = {
        from: vi
          .fn()
          .mockReturnValueOnce(cacheReadChain.chain) // First call for getCached
          .mockReturnValueOnce(cacheWriteChain.chain), // Second call for storeInCache
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockResolvedValue(songlinkResponse);
      mockBuildUniversalCard.mockReturnValue(builtCard);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/999abc',
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(builtCard);

      // Give a brief moment for the fire-and-forget cache write to attempt
      // The route does not await storeInCache, but we can verify the attempt was made
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
    });

    it('returns 429 when Songlink API rate limits', async () => {
      // Mock cache miss
      const cacheChain = chainMock({ data: null });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);

      // Import RateLimitError dynamically to use the mocked version
      const { RateLimitError } = await import('@/lib/music/songlink');
      mockResolveMusicLinks.mockRejectedValue(new RateLimitError('Rate limited'));

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/rate-limited',
      });

      const res = await GET(req);
      expect(res.status).toBe(429);

      const body = await res.json();
      expect(body.error).toBe('Music link service is temporarily busy. Try again shortly.');

      // Verify warning was logged
      expect(mockLogger.warn).toHaveBeenCalledWith('[music/resolve] rate limited by Songlink');
    });

    it('returns 500 on unexpected error during resolution', async () => {
      // Mock cache miss
      const cacheChain = chainMock({ data: null });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockRejectedValue(new Error('Network error'));

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/network-error',
      });

      const res = await GET(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to resolve music links');

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith('[music/resolve] error:', expect.any(Error));
    });

    it('returns 500 if buildUniversalCard throws', async () => {
      const songlinkResponse = {
        entityUniqueId: 'sp-crash',
        pageUrl: 'https://song.link/crash',
        entitiesByUniqueId: {},
        linksByPlatform: {},
      };

      // Mock cache miss
      const cacheChain = chainMock({ data: null });
      const supabaseMock = {
        from: vi.fn().mockReturnValue(cacheChain.chain),
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockResolvedValue(songlinkResponse);
      mockBuildUniversalCard.mockImplementation(() => {
        throw new Error('Build card failed');
      });

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/crash',
      });

      const res = await GET(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to resolve music links');
    });
  });

  describe('Cache Expiry Logic', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({
        fid: 123,
        username: 'testuser',
      });
    });

    it('treats expired cache as a miss', async () => {
      const songlinkResponse = {
        entityUniqueId: 'sp-expired',
        pageUrl: 'https://song.link/expired',
        entitiesByUniqueId: {
          'sp-expired': {
            id: 'sp-expired',
            title: 'Expired Song',
            artistName: 'Expired Artist',
            thumbnailUrl: 'https://example.com/expired.jpg',
          },
        },
        linksByPlatform: {
          spotify: {
            url: 'https://open.spotify.com/track/expired',
            entityUniqueId: 'sp-expired',
          },
        },
      };

      const builtCard = {
        title: 'Expired Song',
        artist: 'Expired Artist',
        thumbnail: 'https://example.com/expired.jpg',
        pageUrl: 'https://song.link/expired',
        platforms: [
          {
            platform: 'spotify',
            label: 'Spotify',
            url: 'https://open.spotify.com/track/expired',
            color: '#1DB954',
          },
        ],
      };

      // Mock cache with expired timestamp
      const cacheChain = chainMock({
        data: {
          card_data: { title: 'Old Song' },
          expires_at: new Date(Date.now() - 1000).toISOString(), // Expired 1 sec ago
        },
      });

      const supabaseMock = {
        from: vi
          .fn()
          .mockReturnValueOnce(cacheChain.chain) // Cache read
          .mockReturnValueOnce(chainMock({ error: { code: '42P01' } }).chain), // Cache write (ignored)
      };

      mockGetSupabaseAdmin.mockReturnValue(supabaseMock);
      mockResolveMusicLinks.mockResolvedValue(songlinkResponse);
      mockBuildUniversalCard.mockReturnValue(builtCard);

      const req = makeGetRequest('/api/music/resolve', {
        url: 'https://open.spotify.com/track/expired',
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual(builtCard);

      // Verify Songlink was called (cache was treated as miss)
      expect(mockResolveMusicLinks).toHaveBeenCalled();
    });
  });
});
