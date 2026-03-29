import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mock getSessionData ───────────────────────────────────────────────────────
const mockSession = { userId: 'test-user', address: '0x123' };
vi.mock('@/lib/auth/session', () => ({
  getSessionData: vi.fn(() => Promise.resolve(mockSession)),
}));

// ─── Mock fetch ────────────────────────────────────────────────────────────────
function makeMockFetch(responseData: unknown, ok = true, status = 200) {
  return vi.fn(() =>
    Promise.resolve({ ok, status, json: () => Promise.resolve(responseData) }),
  ) as unknown as typeof fetch;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeRequest(url: string) {
  const req = new NextRequest(`http://localhost/api/music/metadata?url=${encodeURIComponent(url)}`);
  return req;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe('GET /api/music/metadata', async () => {
  // Lazy-import the route handler so mocks are set up first
  const { GET } = await import('./route');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────
  it('returns 401 when no session', async () => {
    vi.mock('@/lib/auth/session', () => ({
      getSessionData: vi.fn(() => Promise.resolve(null)),
    }));

    const { GET: GET2 } = await import('./route');
    const res = await GET2(makeRequest('https://open.spotify.com/track/abc'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when url param is missing', async () => {
    const req = new NextRequest('http://localhost/api/music/metadata');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('url');
  });

  it('returns 400 when url is not a music URL', async () => {
    const res = await GET(makeRequest('https://example.com'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('music');
  });

  // ─── Spotify ─────────────────────────────────────────────────────────────
  it('returns metadata for a Spotify track URL', async () => {
    global.fetch = makeMockFetch({
      title: 'Test Track',
      author_name: 'Test Artist',
      thumbnail_url: 'https://i.scdn.co/image/test.jpg',
    });

    const res = await GET(makeRequest('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('spotify');
    expect(json.trackName).toBe('Test Track');
    expect(json.artistName).toBe('Test Artist');
    expect(json.artworkUrl).toBe('https://i.scdn.co/image/test.jpg');
  });

  it('returns null metadata when Spotify oEmbed fails', async () => {
    global.fetch = makeMockFetch({}, false, 404);
    const res = await GET(makeRequest('https://open.spotify.com/track/abc'));
    expect(res.status).toBe(404);
  });

  // ─── SoundCloud ───────────────────────────────────────────────────────────
  it('returns metadata for a SoundCloud track URL', async () => {
    global.fetch = makeMockFetch({
      title: 'Chill Vibes',
      author_name: 'DJ Test',
      thumbnail_url: 'https://i1.sndcdn.com/artworks-test.jpg',
    });

    const res = await GET(makeRequest('https://soundcloud.com/user/track-name'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('soundcloud');
    expect(json.trackName).toBe('Chill Vibes');
    expect(json.artistName).toBe('DJ Test');
  });

  it('returns 404 when SoundCloud oEmbed fails', async () => {
    global.fetch = makeMockFetch({}, false, 500);
    const res = await GET(makeRequest('https://soundcloud.com/user/track-name'));
    expect(res.status).toBe(404);
  });

  // ─── YouTube ───────────────────────────────────────────────────────────────
  it('returns metadata for a YouTube watch URL', async () => {
    global.fetch = makeMockFetch({
      title: 'Amazing Video',
      author_name: 'Creator',
      thumbnail_url: 'https://img.youtube.com/vi/testId/0.jpg',
    });

    const res = await GET(makeRequest('https://www.youtube.com/watch?v=testId'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('youtube');
    expect(json.trackName).toBe('Amazing Video');
    expect(json.artistName).toBe('Creator');
    expect(json.artworkUrl).toContain('img.youtube.com');
  });

  it('returns metadata for a YouTube shorts URL', async () => {
    global.fetch = makeMockFetch({
      title: 'Short Video',
      author_name: 'Creator',
      thumbnail_url: 'https://i.ytimg.com/vi/testId/0.jpg',
    });

    const res = await GET(makeRequest('https://youtube.com/shorts/testId'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('youtube');
  });

  it('returns metadata for a youtu.be short URL', async () => {
    global.fetch = makeMockFetch({ title: 'Short', author_name: 'Youtuber', thumbnail_url: '' });
    const res = await GET(makeRequest('https://youtu.be/testId'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('youtube');
  });

  it('returns 404 when YouTube oEmbed fails', async () => {
    global.fetch = makeMockFetch({}, false, 403);
    const res = await GET(makeRequest('https://youtube.com/watch?v=test'));
    expect(res.status).toBe(404);
  });

  // ─── Apple Music ──────────────────────────────────────────────────────────
  it('returns metadata for Apple Music URL via oEmbed', async () => {
    global.fetch = makeMockFetch({
      title: 'Apple Track',
      author_name: 'Apple Artist',
      thumbnail_url: 'https://music.apple.com/artwork.jpg',
    });

    const res = await GET(makeRequest('https://music.apple.com/us/album/test-album/1234567890'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('applemusic');
    expect(json.trackName).toBe('Apple Track');
    expect(json.artistName).toBe('Apple Artist');
  });

  it('returns fallback metadata for Apple Music when oEmbed fails', async () => {
    global.fetch = makeMockFetch({}, false, 500);
    const res = await GET(makeRequest('https://music.apple.com/us/album/my-album/123'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('applemusic');
    // Fallback uses album name from URL
    expect(json.trackName).toBe('my album');
  });

  // ─── Tidal ────────────────────────────────────────────────────────────────
  it('returns metadata for Tidal URL via oEmbed', async () => {
    global.fetch = makeMockFetch({
      title: 'Tidal Track',
      author_name: 'Tidal Artist',
      thumbnail_url: 'https://Tidal.com/art.jpg',
    });

    const res = await GET(makeRequest('https://tidal.com/track/12345678'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('tidal');
    expect(json.trackName).toBe('Tidal Track');
  });

  it('returns fallback for Tidal when oEmbed fails', async () => {
    global.fetch = makeMockFetch({}, false, 500);
    const res = await GET(makeRequest('https://tidal.com/track/999'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('tidal');
    expect(json.trackName).toBe('Tidal Track'); // hardcoded fallback
  });

  // ─── Bandcamp ─────────────────────────────────────────────────────────────
  it('returns metadata for Bandcamp track URL via oEmbed', async () => {
    global.fetch = makeMockFetch({
      title: 'Bandcamp Track',
      author_name: 'BC Artist',
      thumbnail_url: 'https://bandcamp.com/art.jpg',
    });

    const res = await GET(makeRequest('https://artist.bandcamp.com/track/track-name'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('bandcamp');
    expect(json.trackName).toBe('Bandcamp Track');
  });

  it('returns fallback for Bandcamp when oEmbed fails', async () => {
    global.fetch = makeMockFetch({}, false, 500);
    const res = await GET(makeRequest('https://myband.bandcamp.com/track/cool-track'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('bandcamp');
    expect(json.trackName).toBe('cool track'); // dashes replaced
    expect(json.artistName).toBe('myband');
  });

  // ─── Direct audio URL ─────────────────────────────────────────────────────
  it('returns audio metadata for direct MP3 URL', async () => {
    const res = await GET(makeRequest('https://example.com/mysong.mp3'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('audio');
    expect(json.trackName).toBe('mysong.mp3');
  });

  it('returns audio metadata for OGG URL', async () => {
    const res = await GET(makeRequest('https://example.com/audio.ogg'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('audio');
  });

  // ─── Cache-Control header ──────────────────────────────────────────────────
  it('sets Cache-Control header on successful response', async () => {
    global.fetch = makeMockFetch({ title: 'T', author_name: 'A', thumbnail_url: '' });
    const res = await GET(makeRequest('https://open.spotify.com/track/abc'));
    expect(res.headers.get('Cache-Control')).toContain('public');
  });

  // ─── Error handling ───────────────────────────────────────────────────────
  it('returns 500 when fetch throws', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as typeof fetch;
    const res = await GET(makeRequest('https://open.spotify.com/track/abc'));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
