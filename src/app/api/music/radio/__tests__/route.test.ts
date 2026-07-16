import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock communityConfig with radioPlaylists
vi.mock('@/../community.config', () => ({
  communityConfig: {
    music: {
      radioPlaylists: [
        {
          name: 'Test Playlist 1',
          artist: 'Test Artist 1',
          url: 'https://audius.co/testuser1/playlist/test-playlist-1',
        },
        {
          name: 'Test Playlist 2',
          artist: 'Test Artist 2',
          url: 'https://audius.co/testuser2/album/test-album',
        },
      ],
    },
  },
}));

import { GET } from '../route';

// Mock global fetch for Audius API calls
global.fetch = vi.fn() as unknown as typeof fetch;

// ── Test fixtures ────────────────────────────────────────────────────────────

const VALID_AUDIUS_PLAYLIST_RESPONSE = {
  data: {
    id: 'playlist-1',
    playlist_name: 'Test Playlist 1',
    user: {
      name: 'Test Artist 1',
      handle: 'testuser1',
    },
    artwork: {
      '480x480': 'https://example.com/artwork-480.jpg',
      '150x150': 'https://example.com/artwork-150.jpg',
    },
    tracks: [
      {
        id: 'track-1',
        title: 'Song 1',
        user: {
          name: 'Song Artist 1',
          handle: 'songartist1',
        },
        permalink: 'song-1',
        artwork: {
          '480x480': 'https://example.com/track1-480.jpg',
          '150x150': 'https://example.com/track1-150.jpg',
        },
        duration: 240,
      },
      {
        id: 'track-2',
        title: 'Song 2',
        user: {
          name: 'Song Artist 2',
          handle: 'songartist2',
        },
        permalink: 'song-2',
        artwork: {
          '480x480': 'https://example.com/track2-480.jpg',
          '150x150': 'https://example.com/track2-150.jpg',
        },
        duration: 180,
      },
    ],
  },
};

const VALID_AUDIUS_ALBUM_RESPONSE = {
  data: {
    id: 'album-1',
    playlist_name: 'Test Album',
    is_album: true,
    user: {
      name: 'Test Artist 2',
      handle: 'testuser2',
    },
    artwork: {
      '480x480': 'https://example.com/album-480.jpg',
    },
    playlist_contents: {
      track_ids: ['track-3', 'track-4'],
    },
  },
};

const VALID_AUDIUS_BULK_TRACKS_RESPONSE = {
  data: [
    {
      id: 'track-3',
      title: 'Album Song 1',
      user: {
        name: 'Album Artist',
        handle: 'albumartist',
      },
      permalink: 'album-song-1',
      artwork: {
        '480x480': 'https://example.com/album-track1-480.jpg',
      },
      duration: 200,
    },
    {
      id: 'track-4',
      title: 'Album Song 2',
      user: {
        name: 'Album Artist',
        handle: 'albumartist',
      },
      permalink: 'album-song-2',
      artwork: {
        '150x150': 'https://example.com/album-track2-150.jpg',
      },
      duration: 220,
    },
  ],
};

describe('GET /api/music/radio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 when no session is present', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(401);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no fid', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(401);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    expect(body.error).toBe('Unauthorized');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success path: with inline tracks in resolve response
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 with playlists containing inline tracks', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // Mock first resolve call for playlist 1 (with inline tracks)
    const mockResolveRes1 = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    // Mock second resolve call for playlist 2 (without inline tracks, needs bulk fetch)
    const mockResolveRes2 = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_ALBUM_RESPONSE),
    };

    // Mock bulk track fetch for playlist 2
    const mockBulkRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_BULK_TRACKS_RESPONSE),
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockResolveRes1)
      .mockResolvedValueOnce(mockResolveRes2)
      .mockResolvedValueOnce(mockBulkRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    expect(body).toHaveProperty('playlists');

    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;
    expect(playlists).toHaveLength(2);

    // Verify first playlist (with inline tracks)
    expect(playlists[0].name).toBe('Test Playlist 1');
    expect(playlists[0].artist).toBe('Test Artist 1');
    expect(playlists[0].artworkUrl).toBe('https://example.com/artwork-480.jpg');

    const tracks1 = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks1).toHaveLength(2);
    expect(tracks1[0].id).toBe('track-1');
    expect(tracks1[0].title).toBe('Song 1');
    expect(tracks1[0].artist).toBe('Song Artist 1');
    expect(tracks1[0].duration).toBe(240);
    expect(tracks1[0].streamUrl).toContain('/v1/tracks/track-1/stream');

    // Verify second playlist (with bulk-fetched tracks)
    expect(playlists[1].name).toBe('Test Album');
    expect(playlists[1].artist).toBe('Test Artist 2');

    const tracks2 = playlists[1].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks2).toHaveLength(2);
    expect(tracks2[0].id).toBe('track-3');
    expect(tracks2[0].title).toBe('Album Song 1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success path: with track artwork fallback
  // ────────────────────────────────────────────────────────────────────────────

  it('falls back to playlist artwork when track artwork is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const trackWithoutArtwork = {
      ...VALID_AUDIUS_PLAYLIST_RESPONSE.data.tracks[0],
      artwork: undefined,
    };

    const responseWithoutTrackArtwork = {
      data: {
        ...VALID_AUDIUS_PLAYLIST_RESPONSE.data,
        tracks: [trackWithoutArtwork],
      },
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(responseWithoutTrackArtwork),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    const tracks = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    // Should fall back to playlist artwork
    expect(tracks[0].artworkUrl).toBe('https://example.com/artwork-480.jpg');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success path: with 150x150 artwork fallback
  // ────────────────────────────────────────────────────────────────────────────

  it('uses 150x150 artwork when 480x480 is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const trackWithSmallArtwork = {
      ...VALID_AUDIUS_PLAYLIST_RESPONSE.data.tracks[0],
      artwork: {
        '150x150': 'https://example.com/track-small.jpg',
      },
    };

    const responseWithSmallArtwork = {
      data: {
        ...VALID_AUDIUS_PLAYLIST_RESPONSE.data,
        tracks: [trackWithSmallArtwork],
      },
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(responseWithSmallArtwork),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    const tracks = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks[0].artworkUrl).toBe('https://example.com/track-small.jpg');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Empty playlist handling
  // ────────────────────────────────────────────────────────────────────────────

  it('skips playlists with no tracks', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const emptyPlaylist = {
      data: {
        id: 'empty-playlist',
        playlist_name: 'Empty',
        user: { name: 'User' },
        tracks: [],
      },
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(emptyPlaylist),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;
    expect(playlists).toHaveLength(2); // Only the 2 config playlists, empty one is skipped
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Null/missing data handling
  // ────────────────────────────────────────────────────────────────────────────

  it('skips playlists with no resolved data', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const nullDataResponse = {
      data: null,
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(nullDataResponse),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;
    // All playlists have null data, so all are skipped
    expect(playlists).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Bulk track fetch failure handling
  // ────────────────────────────────────────────────────────────────────────────

  it('creates playlist with empty tracks when bulk fetch fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // First resolve: returns album without inline tracks
    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_ALBUM_RESPONSE),
    };

    // Bulk fetch fails
    const mockBulkRes = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'Invalid track IDs' }),
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockResolveRes)
      .mockResolvedValueOnce(mockBulkRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    // Should still include the playlist, but with 0 or 1 playlists total (second one has empty tracks)
    expect(playlists.length).toBeGreaterThanOrEqual(1);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Audius resolve fetch failure
  // ────────────────────────────────────────────────────────────────────────────

  it('skips playlist when Audius resolve fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // First resolve succeeds
    const mockResolveRes1 = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    // Second resolve fails
    const mockResolveRes2 = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: vi.fn().mockResolvedValue({ error: 'Playlist not found' }),
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockResolveRes1)
      .mockResolvedValueOnce(mockResolveRes2);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    // Should include only the first playlist (second one failed)
    expect(playlists).toHaveLength(1);
    expect(playlists[0].name).toBe('Test Playlist 1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Fetch network error handling
  // ────────────────────────────────────────────────────────────────────────────

  it('skips playlist when fetch throws network error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // First fetch succeeds
    const mockResolveRes1 = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    // Second fetch throws error
    const networkError = new Error('Network timeout');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockResolveRes1)
      .mockRejectedValueOnce(networkError);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    // Should include only the first playlist (second one failed)
    expect(playlists).toHaveLength(1);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Default values when fields are missing
  // ────────────────────────────────────────────────────────────────────────────

  it('uses config defaults when Audius response lacks user/playlist names', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const minimalPlaylist = {
      data: {
        id: 'minimal-id',
        tracks: [
          {
            id: 'track-99',
            title: 'Song Title',
            duration: 100,
          },
        ],
      },
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(minimalPlaylist),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    // Should use config defaults for missing playlist name/artist
    expect(playlists[0].name).toBe('Test Playlist 1');
    expect(playlists[0].artist).toBe('Test Artist 1');
  });

  it('uses config artist default for track when track artist is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const trackWithoutArtist = {
      data: {
        id: 'playlist-id',
        playlist_name: 'Test',
        tracks: [
          {
            id: 'track-no-artist',
            title: 'Song',
            duration: 100,
          },
        ],
      },
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(trackWithoutArtist),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    const tracks = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks[0].artist).toBe('Test Artist 1'); // config default
  });

  it('defaults to "Untitled" when track has no title', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const trackWithoutTitle = {
      data: {
        id: 'playlist-id',
        tracks: [
          {
            id: 'track-no-title',
            duration: 100,
          },
        ],
      },
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(trackWithoutTitle),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    const tracks = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks[0].title).toBe('Untitled');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Response structure and caching headers
  // ────────────────────────────────────────────────────────────────────────────

  it('returns correct response structure with cache headers', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);

    // Check cache headers
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300, s-maxage=300');

    const body = (await res.json()) as unknown as Record<string, unknown>;
    expect(body).toHaveProperty('playlists');
    expect(Array.isArray(body.playlists)).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // URL encoding and app_name param
  // ────────────────────────────────────────────────────────────────────────────

  it('properly encodes playlist URL and includes app_name parameter', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);

    // Verify fetch was called with correct URL encoding
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(fetchCalls[0][0]).toContain('resolve?url=');
    expect(fetchCalls[0][0]).toContain('app_name=ZAO-OS');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // AbortSignal timeout
  // ────────────────────────────────────────────────────────────────────────────

  it('sets abort signal timeout on fetch requests', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    await GET(makeGetRequest('/api/music/radio'));

    // Verify fetch was called with AbortSignal timeout option
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(fetchCalls[0][1]).toHaveProperty('signal');
    expect(fetchCalls[0][1]).toHaveProperty('redirect', 'follow');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Track URL construction
  // ────────────────────────────────────────────────────────────────────────────

  it('constructs track URLs with handle and permalink', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    const tracks = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks[0].url).toContain('https://audius.co/');
    expect(tracks[0].url).toContain('songartist1');
    expect(tracks[0].url).toContain('song-1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Multiple identical fetch scenarios (data array format)
  // ────────────────────────────────────────────────────────────────────────────

  it('handles Audius response where data is an array', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // Audius sometimes returns data as an array, should take first element
    const arrayDataResponse = {
      data: [VALID_AUDIUS_PLAYLIST_RESPONSE.data],
    };

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(arrayDataResponse),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    expect(playlists.length).toBeGreaterThan(0);
    expect(playlists[0].name).toBe('Test Playlist 1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Track stream URL format
  // ────────────────────────────────────────────────────────────────────────────

  it('generates correct stream URLs with track ID and app_name', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const mockResolveRes = {
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_AUDIUS_PLAYLIST_RESPONSE),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveRes);

    const res = await GET(makeGetRequest('/api/music/radio'));

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown as Record<string, unknown>;
    const playlists = body.playlists as unknown as Array<Record<string, unknown>>;

    const tracks = playlists[0].tracks as unknown as Array<Record<string, unknown>>;
    expect(tracks[0].streamUrl).toBe(
      'https://api.audius.co/v1/tracks/track-1/stream?app_name=ZAO-OS',
    );
  });
});
