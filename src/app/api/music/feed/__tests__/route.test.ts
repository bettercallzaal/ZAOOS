import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockIsMusicUrl } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockIsMusicUrl: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-api-key-12345',
  },
}));

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: mockIsMusicUrl,
}));

// Mock global fetch
global.fetch = vi.fn() as ReturnType<typeof vi.fn>;

import { GET } from '../route';

describe('/api/music/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication ──────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('allows request with valid session', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [], next: { cursor: undefined } } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  // ── Query Parameter Validation ──────────────────────────────────────────

  describe('query parameter validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('uses default channel "all" when not provided', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      await GET(req);

      // searchMusicCasts is called for channel="all"
      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      expect(fetchCalls[0][0]).toContain('cast/search');
    });

    it('uses default limit 20 when not provided', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);

      // The route should call searchMusicCasts with limit=20
      expect(res.status).toBe(200);
    });

    it('accepts custom limit parameter', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { limit: '10' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('returns 400 when limit is less than 1', async () => {
      const req = makeGetRequest('/api/music/feed', { limit: '0' });
      const res = await GET(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error', 'Invalid params');
      expect(body).toHaveProperty('details');
    });

    it('returns 400 when limit exceeds 50', async () => {
      const req = makeGetRequest('/api/music/feed', { limit: '51' });
      const res = await GET(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error', 'Invalid params');
    });

    it('coerces limit to number from string', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { limit: '15' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('accepts limit at boundary value 1', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { limit: '1' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('accepts limit at boundary value 50', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { limit: '50' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('accepts custom channel parameter', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ casts: [] }),
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'music' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Should call getChannelMusicCasts instead of searchMusicCasts
      const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchUrl).toContain('feed/channels');
    });

    it('accepts cursor parameter', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { cursor: 'abc123' });
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  // ── Channel-specific Behavior ───────────────────────────────────────────

  describe('channel behavior', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls searchMusicCasts when channel is "all"', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'all' });
      await GET(req);

      const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchUrl).toContain('cast/search');
    });

    it('calls getChannelMusicCasts when channel is not "all"', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ casts: [] }),
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'music' });
      await GET(req);

      const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchUrl).toContain('feed/channels');
    });

    it('passes channel_ids parameter to feed endpoint', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ casts: [] }),
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'music' });
      await GET(req);

      const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('channel_ids=music');
    });
  });

  // ── Music URL Filtering ─────────────────────────────────────────────────

  describe('music URL filtering and extraction', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('filters casts with music URLs only', async () => {
      const casts = [
        {
          hash: 'cast1',
          author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
          text: 'Check this out',
          timestamp: '2026-07-15T10:00:00Z',
          embeds: [{ url: 'https://spotify.com/track/123' }],
        },
        {
          hash: 'cast2',
          author: { fid: 101, username: 'user2', pfp_url: 'https://example.com/2.jpg' },
          text: 'No music here',
          timestamp: '2026-07-15T10:01:00Z',
        },
      ];

      mockIsMusicUrl.mockImplementation((url: string) => {
        if (url.includes('spotify')) return 'spotify';
        return null;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: unknown[] };

      expect(res.status).toBe(200);
      expect(body.tracks).toHaveLength(1);
      expect(body.tracks[0]).toHaveProperty('castHash', 'cast1');
    });

    it('extracts music URL from embeds', async () => {
      const casts = [
        {
          hash: 'cast1',
          author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
          text: 'Check this',
          timestamp: '2026-07-15T10:00:00Z',
          embeds: [{ url: 'https://soundcloud.com/artist/track' }],
        },
      ];

      mockIsMusicUrl.mockReturnValue('soundcloud');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: Array<{ musicUrl: string; platform: string }> };

      expect(res.status).toBe(200);
      expect(body.tracks[0].musicUrl).toBe('https://soundcloud.com/artist/track');
      expect(body.tracks[0].platform).toBe('soundcloud');
    });

    it('extracts music URL from text when no embeds', async () => {
      const casts = [
        {
          hash: 'cast1',
          author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
          text: 'Check https://audius.co/artist/track',
          timestamp: '2026-07-15T10:00:00Z',
        },
      ];

      mockIsMusicUrl.mockImplementation((url: string) => {
        if (url.includes('audius')) return 'audius';
        return null;
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: Array<{ musicUrl: string; platform: string }> };

      expect(res.status).toBe(200);
      expect(body.tracks[0].musicUrl).toBe('https://audius.co/artist/track');
      expect(body.tracks[0].platform).toBe('audius');
    });

    it('maps platform to correct TrackType', async () => {
      const casts = [
        {
          hash: 'cast1',
          author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
          text: 'Music',
          timestamp: '2026-07-15T10:00:00Z',
          embeds: [{ url: 'https://youtube.com/watch?v=123' }],
        },
      ];

      mockIsMusicUrl.mockReturnValue('youtube');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: Array<{ platform: string }> };

      expect(body.tracks[0].platform).toBe('youtube');
    });
  });

  // ── Response Shape ──────────────────────────────────────────────────────

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns tracks array with correct fields', async () => {
      const casts = [
        {
          hash: 'abc123',
          author: { fid: 456, username: 'alice', pfp_url: 'https://example.com/alice.jpg' },
          text: 'Great track',
          timestamp: '2026-07-15T10:00:00Z',
          embeds: [{ url: 'https://spotify.com/track/xyz' }],
        },
      ];

      mockIsMusicUrl.mockReturnValue('spotify');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as {
        tracks: Array<{
          castHash: string;
          authorFid: number;
          authorUsername: string;
          authorPfp: string;
          castText: string;
          musicUrl: string;
          platform: string;
          timestamp: string;
        }>;
      };

      expect(res.status).toBe(200);
      expect(body.tracks).toHaveLength(1);
      const track = body.tracks[0];
      expect(track.castHash).toBe('abc123');
      expect(track.authorFid).toBe(456);
      expect(track.authorUsername).toBe('alice');
      expect(track.authorPfp).toBe('https://example.com/alice.jpg');
      expect(track.castText).toBe('Great track');
      expect(track.musicUrl).toBe('https://spotify.com/track/xyz');
      expect(track.platform).toBe('spotify');
      expect(track.timestamp).toBe('2026-07-15T10:00:00Z');
    });

    it('returns nextCursor from Neynar response', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { casts: [], next: { cursor: 'next-cursor-123' } },
        }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { nextCursor: string | null };

      expect(res.status).toBe(200);
      expect(body.nextCursor).toBe('next-cursor-123');
    });

    it('returns null for nextCursor when not present', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { nextCursor: null };

      expect(res.status).toBe(200);
      expect(body.nextCursor).toBeNull();
    });

    it('includes Cache-Control header', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);

      expect(res.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=60',
      );
    });
  });

  // ── Empty/Edge Cases ────────────────────────────────────────────────────

  describe('empty feed', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns empty tracks array when no casts found', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: unknown[] };

      expect(res.status).toBe(200);
      expect(body.tracks).toEqual([]);
    });

    it('returns empty tracks array when no casts have music URLs', async () => {
      const casts = [
        {
          hash: 'cast1',
          author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
          text: 'No music here',
          timestamp: '2026-07-15T10:00:00Z',
          embeds: [{ url: 'https://example.com' }],
        },
      ];

      mockIsMusicUrl.mockReturnValue(null);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: unknown[] };

      expect(res.status).toBe(200);
      expect(body.tracks).toEqual([]);
    });
  });

  // ── Limit Enforcement ───────────────────────────────────────────────────

  describe('limit enforcement', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('stops at limit even if more casts with music exist', async () => {
      const casts = Array.from({ length: 30 }, (_, i) => ({
        hash: `cast${i}`,
        author: { fid: 100 + i, username: `user${i}`, pfp_url: 'https://example.com/pfp.jpg' },
        text: `Track ${i}`,
        timestamp: '2026-07-15T10:00:00Z',
        embeds: [{ url: `https://spotify.com/track/${i}` }],
      }));

      mockIsMusicUrl.mockReturnValue('spotify');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts } }),
      });

      const req = makeGetRequest('/api/music/feed', { limit: '10' });
      const res = await GET(req);
      const body = (await res.json()) as { tracks: unknown[] };

      expect(res.status).toBe(200);
      expect(body.tracks.length).toBeLessThanOrEqual(10);
    });
  });

  // ── Cursor Passthrough ──────────────────────────────────────────────────

  describe('cursor passthrough', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('passes cursor to searchMusicCasts', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed', { cursor: 'cursor-abc' });
      await GET(req);

      const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('cursor=cursor-abc');
    });

    it('passes cursor to getChannelMusicCasts', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ casts: [] }),
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'music', cursor: 'next123' });
      await GET(req);

      const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('cursor=next123');
    });
  });

  // ── Neynar API Error Handling ───────────────────────────────────────────

  describe('Neynar API error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when Neynar returns error status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Neynar server error',
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'music' });
      const res = await GET(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toHaveProperty('error', 'Failed to fetch music feed');
    });

    it('returns 200 with empty tracks when searchMusicCasts fetch rejects (allSettled tolerates)', async () => {
      // searchMusicCasts uses Promise.allSettled, so rejections don't throw
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as { tracks: unknown[] };

      // Promise.allSettled catches rejections, so this returns 200 with empty tracks
      expect(res.status).toBe(200);
      expect(body.tracks).toEqual([]);
    });

    it('tolerates partial failures in searchMusicCasts domains', async () => {
      // First two calls fail, third succeeds
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              casts: [
                {
                  hash: 'cast1',
                  author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
                  text: 'Music',
                  timestamp: '2026-07-15T10:00:00Z',
                  embeds: [{ url: 'https://spotify.com/track/123' }],
                },
              ],
            },
          }),
        });

      mockIsMusicUrl.mockReturnValue('spotify');

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { tracks: unknown[] };
      expect(body.tracks.length).toBeGreaterThan(0);
    });
  });

  // ── Generic Error Handling ──────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 on unexpected error', async () => {
      mockIsMusicUrl.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            casts: [
              {
                hash: 'cast1',
                author: { fid: 100, username: 'user1', pfp_url: 'https://example.com/1.jpg' },
                text: 'Music',
                timestamp: '2026-07-15T10:00:00Z',
                embeds: [{ url: 'https://spotify.com/track/123' }],
              },
            ],
          },
        }),
      });

      const req = makeGetRequest('/api/music/feed');
      const res = await GET(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toHaveProperty('error', 'Failed to fetch music feed');
    });

    it('returns 500 on getChannelMusicCasts error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable',
      });

      const req = makeGetRequest('/api/music/feed', { channel: 'music' });
      const res = await GET(req);
      const body = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch music feed');
    });
  });

  // ── API Headers ─────────────────────────────────────────────────────────

  describe('Neynar API headers', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('includes x-api-key header in Neynar requests', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      await GET(req);

      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const headers = fetchCalls[0][1] as { headers: Record<string, string> };
      expect(headers.headers['x-api-key']).toBe('test-api-key-12345');
    });

    it('includes Content-Type header in Neynar requests', async () => {
      mockIsMusicUrl.mockReturnValue(null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { casts: [] } }),
      });

      const req = makeGetRequest('/api/music/feed');
      await GET(req);

      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const headers = fetchCalls[0][1] as { headers: Record<string, string> };
      expect(headers.headers['Content-Type']).toBe('application/json');
    });
  });
});
