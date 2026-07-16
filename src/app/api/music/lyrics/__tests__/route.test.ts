import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch for external lyrics APIs
global.fetch = vi.fn();

import { GET } from '../route';

describe('GET /api/music/lyrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    // Clear fetch mock state (not its implementation)
    vi.mocked(global.fetch).mockClear();
  });

  afterEach(() => {
    // Reset fetch to a clean state for next test
    vi.mocked(global.fetch).mockReset();
  });

  // ─── Auth guard ─────────────────────────────────────────────────────────
  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'Taylor Swift', title: 'Anti-Hero' }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // ─── Input validation ────────────────────────────────────────────────────
  it('returns 400 when artist is missing', async () => {
    const res = await GET(makeGetRequest('/api/music/lyrics', { title: 'Song' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const res = await GET(makeGetRequest('/api/music/lyrics', { artist: 'Artist' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when artist is empty string', async () => {
    const res = await GET(makeGetRequest('/api/music/lyrics', { artist: '', title: 'Song' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid parameters');
  });

  it('returns 400 when title is empty string', async () => {
    const res = await GET(makeGetRequest('/api/music/lyrics', { artist: 'Artist', title: '' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid parameters');
  });

  it('returns 400 when artist exceeds 200 characters', async () => {
    const longArtist = 'A'.repeat(201);
    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: longArtist, title: 'Song' }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid parameters');
  });

  it('returns 400 when title exceeds 200 characters', async () => {
    const longTitle = 'T'.repeat(201);
    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'Artist', title: longTitle }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid parameters');
  });

  // ─── Success: LRCLIB hit ─────────────────────────────────────────────────
  it('returns lyrics from LRCLIB on success with both plain and synced', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'It was me, hi, the problem is me',
        syncedLyrics: '[00:00.00]It was me',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'Taylor Swift', title: 'Anti-Hero' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('It was me, hi, the problem is me');
    expect(body.syncedLyrics).toBe('[00:00.00]It was me');
    expect(body.source).toBe('lrclib');
  });

  it('returns lyrics from LRCLIB with only plain lyrics (no synced)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'Some plain lyrics only',
        syncedLyrics: null,
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'Artist2', title: 'Song2' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Some plain lyrics only');
    expect(body.syncedLyrics).toBeNull();
    expect(body.source).toBe('lrclib');
  });

  // ─── Fallback chain: LRCLIB fails → lyrics.ovh ─────────────────────────
  it('falls back to lyrics.ovh when LRCLIB returns no lyrics', async () => {
    // LRCLIB: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: null,
        syncedLyrics: null,
      }),
    } as Response);

    // lyrics.ovh: returns lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: 'Fallback lyrics from lyrics.ovh',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'FallbackArtist1', title: 'FallbackTitle1' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Fallback lyrics from lyrics.ovh');
    expect(body.syncedLyrics).toBeNull();
    expect(body.source).toBe('lyrics.ovh');
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
  });

  it('falls back to lyrist when both LRCLIB and lyrics.ovh fail', async () => {
    // LRCLIB: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: null,
        syncedLyrics: null,
      }),
    } as Response);

    // lyrics.ovh: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: null,
      }),
    } as Response);

    // lyrist: returns lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: 'Lyrics from lyrist',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'FallbackArtist2', title: 'FallbackTitle2' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Lyrics from lyrist');
    expect(body.source).toBe('lyrist');
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(3);
  });

  // ─── Not found (all sources fail) ───────────────────────────────────────
  it('returns null lyrics when all sources return no lyrics', async () => {
    // LRCLIB: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: null,
        syncedLyrics: null,
      }),
    } as Response);

    // lyrics.ovh: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: null,
      }),
    } as Response);

    // lyrist: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: null,
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'NotFoundArtist', title: 'NotFoundTitle' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBeNull();
    expect(body.syncedLyrics).toBeNull();
    expect(body.source).toBe('');
  });

  // ─── API errors (network, malformed responses, timeouts) ────────────────
  it('handles LRCLIB fetch errors gracefully', async () => {
    // LRCLIB: network error
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    // lyrics.ovh: returns lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: 'Fallback after lrclib error',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'ErrorArtist1', title: 'ErrorTitle1' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Fallback after lrclib error');
    expect(body.source).toBe('lyrics.ovh');
  });

  it('handles lyrics.ovh fetch errors gracefully', async () => {
    // LRCLIB: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: null,
        syncedLyrics: null,
      }),
    } as Response);

    // lyrics.ovh: network error
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    // lyrist: returns lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: 'Fallback after ovh error',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'ErrorArtist2', title: 'ErrorTitle2' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Fallback after ovh error');
    expect(body.source).toBe('lyrist');
  });

  it('handles lyrist fetch errors gracefully', async () => {
    // LRCLIB: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: null,
        syncedLyrics: null,
      }),
    } as Response);

    // lyrics.ovh: no lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: null,
      }),
    } as Response);

    // lyrist: network error
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'ErrorArtist3', title: 'ErrorTitle3' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBeNull();
    expect(body.source).toBe('');
  });

  it('handles HTTP error responses (non-2xx) from LRCLIB', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    // lyrics.ovh: returns lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: 'Fallback after http error',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'HttpErrorArtist', title: 'HttpErrorTitle' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Fallback after http error');
    expect(body.source).toBe('lyrics.ovh');
  });

  it('handles malformed JSON responses gracefully', async () => {
    // LRCLIB: malformed JSON
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    // lyrics.ovh: returns lyrics
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: 'Fallback after json error',
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'JsonErrorArtist', title: 'JsonErrorTitle' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('Fallback after json error');
    expect(body.source).toBe('lyrics.ovh');
  });

  // ─── Caching ────────────────────────────────────────────────────────────
  it('caches lyrics and returns the same result on cached hit', async () => {
    // Use a unique artist/title combo to ensure no prior cache pollution
    const uniqueArtist = `UniqueArtist_${Date.now()}`;
    const uniqueTitle = `UniqueTitle_${Date.now()}`;

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'Unique cached lyrics',
        syncedLyrics: null,
      }),
    } as Response);

    // First request
    const res1 = await GET(
      makeGetRequest('/api/music/lyrics', { artist: uniqueArtist, title: uniqueTitle }),
    );
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.lyrics).toBe('Unique cached lyrics');

    // Second request should use cache (no new fetch setup needed)
    const res2 = await GET(
      makeGetRequest('/api/music/lyrics', { artist: uniqueArtist, title: uniqueTitle }),
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.lyrics).toBe('Unique cached lyrics');

    // Only one fetch call (from first request) because second used cache
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it('normalizes cache key (lowercase, trimmed, case-insensitive)', async () => {
    const uniqueArtist = `NormKey_${Date.now()}`;
    const uniqueTitle = `NormTitle_${Date.now()}`;

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'Normalized lyrics',
        syncedLyrics: null,
      }),
    } as Response);

    // First request with mixed case and spaces
    const res1 = await GET(
      makeGetRequest('/api/music/lyrics', {
        artist: `  ${uniqueArtist}  `,
        title: `  ${uniqueTitle}  `,
      }),
    );
    expect(res1.status).toBe(200);

    // Second request with different case should hit the cache (cache key is normalized)
    const res2 = await GET(
      makeGetRequest('/api/music/lyrics', {
        artist: uniqueArtist.toLowerCase(),
        title: uniqueTitle.toLowerCase(),
      }),
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.lyrics).toBe('Normalized lyrics');

    // Only one fetch call (cache normalizes keys by lowercasing + trimming)
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  // ─── Error handling (route-level try/catch) ─────────────────────────────
  it('returns 500 on unexpected error in the handler', async () => {
    // Make getSessionData throw an unexpected error
    mockGetSessionData.mockRejectedValueOnce(new Error('Unexpected error'));

    const res = await GET(makeGetRequest('/api/music/lyrics', { artist: 'Artist', title: 'Song' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.lyrics).toBeNull();
    expect(body.source).toBe('');
  });

  // ─── Encoding and special characters ────────────────────────────────────
  it('properly encodes special characters in query params to external APIs', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'Lyrics with & characters',
        syncedLyrics: null,
      }),
    } as Response);

    await GET(makeGetRequest('/api/music/lyrics', { artist: 'AC/DC', title: 'You & Me' }));

    // Check that fetch was called with URL-encoded parameters
    const fetchCall = vi.mocked(global.fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain(encodeURIComponent('AC/DC'));
    expect(fetchCall).toContain(encodeURIComponent('You & Me'));
  });

  it('handles artist and title with unicode characters', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'ユニコード歌詞',
        syncedLyrics: null,
      }),
    } as Response);

    const res = await GET(
      makeGetRequest('/api/music/lyrics', { artist: 'アーティスト', title: '日本語の曲' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lyrics).toBe('ユニコード歌詞');
  });

  // ─── Response shape validation ──────────────────────────────────────────
  it('always returns lyrics, syncedLyrics, and source fields', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plainLyrics: 'Lyrics',
        syncedLyrics: '[00:00.00]Lyrics',
      }),
    } as Response);

    const res = await GET(makeGetRequest('/api/music/lyrics', { artist: 'Artist', title: 'Song' }));
    const body = await res.json();
    expect(body).toHaveProperty('lyrics');
    expect(body).toHaveProperty('syncedLyrics');
    expect(body).toHaveProperty('source');
  });
});
