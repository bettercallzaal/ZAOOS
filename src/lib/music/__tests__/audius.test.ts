// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAudiusPlaylist,
  getAudiusStreamUrl,
  getAudiusTrack,
  resolveAudiusUrl,
  searchAudiusTracks,
} from '../audius';

vi.stubGlobal('fetch', vi.fn());

// Always reference via the global so we pick up re-stubs in afterEach
function getMockFetch() {
  return fetch as ReturnType<typeof vi.fn>;
}

function mockRedirect(status: number, location: string) {
  getMockFetch().mockResolvedValueOnce({
    ok: false,
    status,
    headers: { get: (h: string) => (h === 'location' ? location : null) },
  });
}

function mockJson(body: unknown) {
  getMockFetch().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

function mockFail(status = 404) {
  getMockFetch().mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // Re-establish the stub so subsequent tests can still use getMockFetch()
  vi.stubGlobal('fetch', vi.fn());
});

// ---------------------------------------------------------------------------
// resolveAudiusUrl
// ---------------------------------------------------------------------------

describe('resolveAudiusUrl', () => {
  it('returns { type: "track", data } when redirect location contains /tracks/', async () => {
    const trackData = { id: 'track-id', title: 'Song' };
    mockRedirect(302, 'https://discoveryprovider.audius.co/v1/tracks/track-id?app_name=ZAO-OS');
    mockJson({ data: trackData });

    const result = await resolveAudiusUrl('https://audius.co/artist/song');
    expect(result).toEqual({ type: 'track', data: trackData });
  });

  it('returns { type: "playlist", data } when redirect location contains /playlists/', async () => {
    const playlistData = { id: 'playlist-id', playlist_name: 'My Playlist', tracks: [] };
    mockRedirect(
      302,
      'https://discoveryprovider.audius.co/v1/playlists/playlist-id?app_name=ZAO-OS',
    );
    // getAudiusPlaylist -> audiusFetch -> fetch
    mockJson({ data: playlistData });

    const result = await resolveAudiusUrl('https://audius.co/artist/playlist/my-playlist');
    expect(result).toEqual({ type: 'playlist', data: playlistData });
  });

  it('returns { type: "user", data } when redirect location contains /users/', async () => {
    const userData = { id: 'user-id', handle: 'artist', track_count: 5, name: 'Artist Name' };
    mockRedirect(302, 'https://discoveryprovider.audius.co/v1/users/user-id?app_name=ZAO-OS');
    // audiusFetch -> fetch
    mockJson({ data: userData });

    const result = await resolveAudiusUrl('https://audius.co/artist');
    expect(result).toEqual({ type: 'user', data: userData });
  });

  it('returns null when 3xx response has no location header', async () => {
    getMockFetch().mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: { get: () => null },
    });

    const result = await resolveAudiusUrl('https://audius.co/artist/song');
    expect(result).toBeNull();
  });

  it('returns null when redirect target fetch returns non-ok', async () => {
    mockRedirect(302, 'https://discoveryprovider.audius.co/v1/tracks/track-id');
    mockFail(404);

    const result = await resolveAudiusUrl('https://audius.co/artist/song');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    getMockFetch().mockRejectedValueOnce(new Error('network'));

    const result = await resolveAudiusUrl('https://audius.co/artist/song');
    expect(result).toBeNull();
  });

  it('detects playlist type from direct response shape with playlist_name', async () => {
    const playlistData = { id: 'pl-1', playlist_name: 'Direct Playlist' };
    getMockFetch().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: playlistData }),
    });

    const result = await resolveAudiusUrl('https://audius.co/artist/playlist');
    expect(result).toEqual({ type: 'playlist', data: playlistData });
  });

  it('detects user type from direct response shape with handle + track_count', async () => {
    const userData = { id: 'u-1', handle: 'djcool', track_count: 10, name: 'DJ Cool' };
    getMockFetch().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: userData }),
    });

    const result = await resolveAudiusUrl('https://audius.co/djcool');
    expect(result).toEqual({ type: 'user', data: userData });
  });

  it('detects track type from direct response shape (no playlist_name, no handle+track_count)', async () => {
    const trackData = { id: 't-1', title: 'Beat Drop' };
    getMockFetch().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: trackData }),
    });

    const result = await resolveAudiusUrl('https://audius.co/djcool/beat-drop');
    expect(result).toEqual({ type: 'track', data: trackData });
  });

  it('follows unknown redirect location and returns playlist when response has playlist_name', async () => {
    const playlistData = { id: 'pl-unknown', playlist_name: 'Fallback Playlist', tracks: [] };
    // Redirect to an unknown path (not /tracks/, /playlists/, or /users/)
    mockRedirect(302, 'https://discoveryprovider.audius.co/v1/resolve?url=something');
    // audiusFetch called for the fallback follow — returns { data: playlistData }
    mockJson({ data: playlistData });

    const result = await resolveAudiusUrl('https://audius.co/unknown');
    expect(result).toEqual({ type: 'playlist', data: playlistData });
  });
});

// ---------------------------------------------------------------------------
// searchAudiusTracks
// ---------------------------------------------------------------------------

describe('searchAudiusTracks', () => {
  it('returns tracks array on success', async () => {
    const trackData = [{ id: 'abc', title: 'Found Track' }];
    mockJson({ data: trackData });

    const result = await searchAudiusTracks('found track');
    expect(result).toEqual(trackData);
  });

  it('returns [] on network error', async () => {
    getMockFetch().mockRejectedValueOnce(new Error('network'));

    const result = await searchAudiusTracks('anything');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAudiusStreamUrl
// ---------------------------------------------------------------------------

describe('getAudiusStreamUrl', () => {
  it('returns URL containing /tracks/${trackId}/stream and app_name=ZAO-OS', () => {
    const trackId = 'abc123';
    const url = getAudiusStreamUrl(trackId);
    expect(url).toContain(`/tracks/${trackId}/stream`);
    expect(url).toContain('app_name=ZAO-OS');
  });
});

// ---------------------------------------------------------------------------
// getAudiusTrack
// ---------------------------------------------------------------------------

describe('getAudiusTrack', () => {
  it('returns null on non-ok response', async () => {
    mockFail(404);

    const result = await getAudiusTrack('nonexistent-id');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAudiusPlaylist
// ---------------------------------------------------------------------------

describe('getAudiusPlaylist', () => {
  it('extracts first element when API returns an array', async () => {
    const playlist1 = { id: 'pl-1', playlist_name: 'First' };
    const playlist2 = { id: 'pl-2', playlist_name: 'Second' };
    mockJson({ data: [playlist1, playlist2] });

    const result = await getAudiusPlaylist('pl-1');
    expect(result).toEqual(playlist1);
  });
});
