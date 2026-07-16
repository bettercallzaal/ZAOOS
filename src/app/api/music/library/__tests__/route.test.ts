import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockIsMusicUrl } = vi.hoisted(() => ({
  mockIsMusicUrl: vi.fn(),
}));

const { mockQuerySongs, mockUpsertSong } = vi.hoisted(() => ({
  mockQuerySongs: vi.fn(),
  mockUpsertSong: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: mockIsMusicUrl,
}));

vi.mock('@/lib/music/library', () => ({
  querySongs: mockQuerySongs,
  upsertSong: mockUpsertSong,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, POST } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

const SAMPLE_SONG = {
  id: 'song-123',
  url: 'https://spotify.com/track/abc123',
  platform: 'spotify',
  title: 'Test Track',
  artist: 'Test Artist',
  artwork_url: 'https://example.com/image.jpg',
  stream_url: 'https://stream.example.com/track',
  duration: 180,
  submitted_by_fid: 123,
  source: 'manual',
  tags: ['test'],
  play_count: 10,
  last_played_at: '2026-07-15T10:00:00Z',
  created_at: '2026-07-14T10:00:00Z',
};

const SAMPLE_SONG_2 = {
  id: 'song-456',
  url: 'https://youtube.com/watch?v=xyz789',
  platform: 'youtube',
  title: 'Another Track',
  artist: 'Another Artist',
  artwork_url: 'https://example.com/image2.jpg',
  stream_url: 'https://stream.example.com/track2',
  duration: 240,
  submitted_by_fid: 124,
  source: 'chat',
  tags: ['music'],
  play_count: 50,
  last_played_at: '2026-07-13T10:00:00Z',
  created_at: '2026-07-13T10:00:00Z',
};

const VALID_MUSIC_URL = 'https://spotify.com/track/abc123';
const _INVALID_URL = 'not-a-url';
const NON_MUSIC_URL = 'https://example.com/random-page';

describe('GET /api/music/library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/music/library'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockQuerySongs).not.toHaveBeenCalled();
    });
  });

  describe('request validation — querySchema', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when sort is not a valid enum', async () => {
      const res = await GET(makeGetRequest('/api/music/library', { sort: 'invalid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
      expect(body.details).toBeDefined();
      expect(mockQuerySongs).not.toHaveBeenCalled();
    });

    it('returns 400 when filter is not a valid enum', async () => {
      const res = await GET(makeGetRequest('/api/music/library', { filter: 'invalid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
      expect(body.details).toBeDefined();
      expect(mockQuerySongs).not.toHaveBeenCalled();
    });

    it('accepts sort=recent', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { sort: 'recent' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalled();
    });

    it('accepts sort=popular', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { sort: 'popular' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalled();
    });

    it('accepts sort=played', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { sort: 'played' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalled();
    });

    it('accepts filter=recent', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { filter: 'recent' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalled();
    });

    it('accepts filter=liked', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { filter: 'liked' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalled();
    });

    it('returns 400 when limit is below 1', async () => {
      const res = await GET(makeGetRequest('/api/music/library', { limit: '0' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('returns 400 when limit exceeds 100', async () => {
      const res = await GET(makeGetRequest('/api/music/library', { limit: '101' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('coerces limit from string to number', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { limit: '25' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ limit: 25 }));
    });

    it('uses default limit of 50 when not provided', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library'));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
    });

    it('returns 400 when offset is negative', async () => {
      const res = await GET(makeGetRequest('/api/music/library', { offset: '-1' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('coerces offset from string to number', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { offset: '10' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ offset: 10 }));
    });

    it('uses default offset of 0 when not provided', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library'));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    it('accepts search parameter up to 200 chars', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });
      const search = 'a'.repeat(200);

      const res = await GET(makeGetRequest('/api/music/library', { search }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ search }));
    });

    it('returns 400 when search exceeds 200 chars', async () => {
      const search = 'a'.repeat(201);
      const res = await GET(makeGetRequest('/api/music/library', { search }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });

    it('accepts platform parameter up to 20 chars', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });
      const platform = 'a'.repeat(20);

      const res = await GET(makeGetRequest('/api/music/library', { platform }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ platform }));
    });

    it('returns 400 when platform exceeds 20 chars', async () => {
      const platform = 'a'.repeat(21);
      const res = await GET(makeGetRequest('/api/music/library', { platform }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid params');
    });
  });

  describe('filter logic', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('forces sort=played when filter=recent', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(
        makeGetRequest('/api/music/library', { filter: 'recent', sort: 'popular' }),
      );

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ sort: 'played' }));
    });

    it('does not override sort for other filters', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(
        makeGetRequest('/api/music/library', { filter: 'liked', sort: 'popular' }),
      );

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ sort: 'popular' }));
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with songs and total when querySongs succeeds', async () => {
      mockQuerySongs.mockResolvedValue({
        songs: [SAMPLE_SONG, SAMPLE_SONG_2],
        total: 2,
      });

      const res = await GET(makeGetRequest('/api/music/library'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.songs).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.songs[0].id).toBe('song-123');
      expect(body.songs[1].id).toBe('song-456');
    });

    it('returns 200 with empty array when no songs match', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [], total: 0 });

      const res = await GET(makeGetRequest('/api/music/library'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.songs).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('includes Cache-Control headers', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library'));

      expect(res.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=60',
      );
    });

    it('passes search parameter to querySongs', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { search: 'test track' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test track' }),
      );
    });

    it('passes platform parameter to querySongs', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { platform: 'spotify' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ platform: 'spotify' }));
    });

    it('passes sort parameter to querySongs', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { sort: 'popular' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(expect.objectContaining({ sort: 'popular' }));
    });

    it('passes limit and offset to querySongs', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(makeGetRequest('/api/music/library', { limit: '25', offset: '10' }));

      expect(res.status).toBe(200);
      expect(mockQuerySongs).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25, offset: 10 }),
      );
    });

    it('queries with all parameters together', async () => {
      mockQuerySongs.mockResolvedValue({ songs: [SAMPLE_SONG], total: 1 });

      const res = await GET(
        makeGetRequest('/api/music/library', {
          search: 'jazz',
          platform: 'spotify',
          sort: 'popular',
          filter: 'liked',
          limit: '20',
          offset: '5',
        }),
      );

      expect(res.status).toBe(200);
      // filter is passed through as-is; sort is only overridden for filter=recent
      expect(mockQuerySongs).toHaveBeenCalledWith({
        search: 'jazz',
        platform: 'spotify',
        sort: 'popular',
        filter: 'liked',
        limit: 20,
        offset: 5,
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when querySongs throws', async () => {
      mockQuerySongs.mockRejectedValue(new Error('Database error'));

      const res = await GET(makeGetRequest('/api/music/library'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load library');
    });

    it('logs error when querySongs throws', async () => {
      const { logger } = await import('@/lib/logger');
      const error = new Error('DB connection failed');
      mockQuerySongs.mockRejectedValue(error);

      await GET(makeGetRequest('/api/music/library'));

      expect(logger.error).toHaveBeenCalledWith('[library] query failed:', expect.any(Error));
    });

    it('returns 500 even on unexpected error', async () => {
      mockQuerySongs.mockRejectedValue(new Error('Unexpected error'));

      const res = await GET(makeGetRequest('/api/music/library'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load library');
    });
  });
});

describe('POST /api/music/library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockUpsertSong).not.toHaveBeenCalled();
    });
  });

  describe('addSchema validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when url is missing', async () => {
      const res = await POST(makePostRequest('/api/music/library', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockUpsertSong).not.toHaveBeenCalled();
    });

    it('returns 400 when url is not a valid URL', async () => {
      const res = await POST(makePostRequest('/api/music/library', { url: 'not-a-url' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when url exceeds 500 characters', async () => {
      const longUrl = `https://spotify.com/track/${'a'.repeat(500)}`;
      const res = await POST(makePostRequest('/api/music/library', { url: longUrl }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid URL up to 500 characters', async () => {
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const url = `https://spotify.com/track/${'a'.repeat(470)}`; // Just under 500
      const res = await POST(makePostRequest('/api/music/library', { url }));

      expect(res.status).toBe(200);
    });
  });

  describe('isMusicUrl integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when isMusicUrl returns null (non-music URL)', async () => {
      mockIsMusicUrl.mockReturnValue(null);

      const res = await POST(makePostRequest('/api/music/library', { url: NON_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Not a recognized music URL');
    });

    it('calls isMusicUrl with the provided URL', async () => {
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockIsMusicUrl).toHaveBeenCalledWith(VALID_MUSIC_URL);
    });

    it('recognizes spotify URLs', async () => {
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library', {
          url: 'https://spotify.com/track/abc123',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('recognizes youtube URLs', async () => {
      mockIsMusicUrl.mockReturnValue('youtube');
      mockUpsertSong.mockResolvedValue({ id: 'song-456', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library', {
          url: 'https://youtube.com/watch?v=xyz789',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('recognizes soundcloud URLs', async () => {
      mockIsMusicUrl.mockReturnValue('soundcloud');
      mockUpsertSong.mockResolvedValue({ id: 'song-789', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library', {
          url: 'https://soundcloud.com/artist/track',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('recognizes audio file extensions', async () => {
      mockIsMusicUrl.mockReturnValue('audio');
      mockUpsertSong.mockResolvedValue({ id: 'song-mp3', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library', {
          url: 'https://example.com/song.mp3',
        }),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('metadata fetching', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');
    });

    it('attempts to fetch metadata from /api/music/metadata endpoint', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            trackName: 'Test Track',
            artistName: 'Test Artist',
            artworkUrl: 'https://example.com/image.jpg',
            streamUrl: 'https://stream.example.com/track',
            duration: 180000,
          }),
          { status: 200 },
        ),
      );

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/music/metadata?url='),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('proceeds without metadata if fetch fails', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(res.status).toBe(200);
      expect(mockUpsertSong).toHaveBeenCalled();
    });

    it('proceeds without metadata if metadata response is not ok', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }));

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(res.status).toBe(200);
    });

    it('uses NEXT_PUBLIC_URL if available', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_URL;
      process.env.NEXT_PUBLIC_URL = 'https://custom.example.com';

      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://custom.example.com'),
        expect.any(Object),
      );

      process.env.NEXT_PUBLIC_URL = originalEnv;
    });

    it('falls back to VERCEL_URL if NEXT_PUBLIC_URL not set', async () => {
      const originalPublicUrl = process.env.NEXT_PUBLIC_URL;
      const originalVercelUrl = process.env.VERCEL_URL;

      delete process.env.NEXT_PUBLIC_URL;
      process.env.VERCEL_URL = 'vercel-deployment.vercel.app';

      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://vercel-deployment.vercel.app'),
        expect.any(Object),
      );

      process.env.NEXT_PUBLIC_URL = originalPublicUrl;
      process.env.VERCEL_URL = originalVercelUrl;
    });

    it('falls back to localhost:3000 if no public URL is set', async () => {
      const originalPublicUrl = process.env.NEXT_PUBLIC_URL;
      const originalVercelUrl = process.env.VERCEL_URL;

      delete process.env.NEXT_PUBLIC_URL;
      delete process.env.VERCEL_URL;

      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000'),
        expect.any(Object),
      );

      process.env.NEXT_PUBLIC_URL = originalPublicUrl;
      process.env.VERCEL_URL = originalVercelUrl;
    });
  });

  describe('upsertSong integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');
      global.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            trackName: 'Test Track',
            artistName: 'Test Artist',
            artworkUrl: 'https://example.com/image.jpg',
            streamUrl: 'https://stream.example.com/track',
            duration: 180000,
          }),
          { status: 200 },
        ),
      );
    });

    it('calls upsertSong with url, platform, and session fid', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(res.status).toBe(200);
      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          url: VALID_MUSIC_URL,
          platform: 'spotify',
          submittedByFid: 123,
          source: 'manual',
        }),
      );
    });

    it('uses metadata trackName as title', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Track',
        }),
      );
    });

    it('defaults to "Untitled" when trackName is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Untitled',
        }),
      );
    });

    it('uses metadata artistName as artist', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          artist: 'Test Artist',
        }),
      );
    });

    it('uses metadata artworkUrl as artworkUrl', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          artworkUrl: 'https://example.com/image.jpg',
        }),
      );
    });

    it('uses metadata streamUrl as streamUrl', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          streamUrl: 'https://stream.example.com/track',
        }),
      );
    });

    it('converts metadata duration from ms to seconds', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 180, // 180000 / 1000
        }),
      );
    });

    it('defaults duration to 0 when metadata is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 0,
        }),
      );
    });
  });

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    });

    it('returns 200 with song and isNew flag when upsertSong succeeds', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.song).toBeDefined();
      expect(body.isNew).toBe(true);
    });

    it('returns isNew=false for existing songs', async () => {
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: false });

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.isNew).toBe(false);
    });

    it('includes song data in response', async () => {
      const songResult = {
        id: 'song-123',
        url: VALID_MUSIC_URL,
        platform: 'spotify',
        title: 'New Track',
        isNew: true,
      };
      mockUpsertSong.mockResolvedValue(songResult as unknown as { id: string; isNew: boolean });

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(body.song).toBeDefined();
      expect(body.song.id).toBe('song-123');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    });

    it('returns 500 when upsertSong throws', async () => {
      mockUpsertSong.mockRejectedValue(new Error('Database error'));

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add song');
    });

    it('logs error when upsertSong throws', async () => {
      const { logger } = await import('@/lib/logger');
      const error = new Error('DB connection failed');
      mockUpsertSong.mockRejectedValue(error);

      await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));

      expect(logger.error).toHaveBeenCalledWith('[library] add failed:', expect.any(Error));
    });

    it('returns 500 on unexpected error during processing', async () => {
      mockUpsertSong.mockRejectedValue(new Error('Unexpected error'));

      const res = await POST(makePostRequest('/api/music/library', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add song');
    });

    it('returns 500 when JSON parsing fails', async () => {
      const res = await POST(
        new (require('next/server').NextRequest)(
          new URL('/api/music/library', 'http://localhost:3000'),
          {
            method: 'POST',
            body: 'invalid json',
          },
        ),
      );

      expect(res.status).toBe(500);
    });
  });
});
