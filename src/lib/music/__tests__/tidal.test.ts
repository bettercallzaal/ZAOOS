// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let searchTidal: (query: string, limit?: number) => Promise<any[]>;
let getTidalTrack: (id: string) => Promise<any | null>;

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn());
  process.env.TIDAL_CLIENT_ID = 'client-id';
  process.env.TIDAL_CLIENT_SECRET = 'client-secret';
  const mod = await import('../tidal');
  searchTidal = mod.searchTidal;
  getTidalTrack = mod.getTidalTrack;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TIDAL_CLIENT_ID;
  delete process.env.TIDAL_CLIENT_SECRET;
});

function mockFetchSequence(...responses: Array<{ ok: boolean; status?: number; body: unknown }>) {
  let call = 0;
  (fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
    const r = responses[call++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 400),
      json: () => Promise.resolve(r.body),
      text: () => Promise.resolve(''),
    });
  });
}

const TOKEN_RESP = { ok: true, body: { access_token: 'tok123', expires_in: 3600 } };

describe('searchTidal', () => {
  it('returns [] when TIDAL_CLIENT_ID is missing', async () => {
    delete process.env.TIDAL_CLIENT_ID;
    const result = await searchTidal('some query');
    expect(result).toEqual([]);
    expect(fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('returns [] when TIDAL_CLIENT_SECRET is missing', async () => {
    delete process.env.TIDAL_CLIENT_SECRET;
    const result = await searchTidal('some query');
    expect(result).toEqual([]);
    expect(fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('returns [] when token request fails (non-ok)', async () => {
    mockFetchSequence({ ok: false, status: 401, body: {} });
    const result = await searchTidal('some query');
    expect(result).toEqual([]);
  });

  it('returns [] when search request fails (non-ok)', async () => {
    mockFetchSequence(TOKEN_RESP, { ok: false, status: 500, body: {} });
    const result = await searchTidal('some query');
    expect(result).toEqual([]);
  });

  it('returns [] when fetch throws an error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));
    const result = await searchTidal('some query');
    expect(result).toEqual([]);
  });

  it('maps data.tracks to TidalTrack array using mapTrack', async () => {
    const rawTrack = {
      id: 42,
      title: 'Glory Box',
      artists: [{ name: 'Portishead' }],
      album: { title: 'Dummy', imageCover: [{ url: 'https://img.example.com/cover.jpg' }] },
      duration: 310,
    };
    mockFetchSequence(TOKEN_RESP, { ok: true, body: { tracks: [rawTrack] } });

    const result = await searchTidal('Glory Box');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '42',
      title: 'Glory Box',
      artist: 'Portishead',
      album: 'Dummy',
      url: 'https://tidal.com/browse/track/42',
    });
  });

  it('returns [] when data.tracks is absent', async () => {
    mockFetchSequence(TOKEN_RESP, { ok: true, body: {} });
    const result = await searchTidal('no tracks here');
    expect(result).toEqual([]);
  });

  it('reuses token on second call (fetch called 3 times total for 2 searches)', async () => {
    const track = {
      id: 1,
      title: 'Track One',
      artists: [{ name: 'Artist One' }],
      album: { title: 'Album One' },
      duration: 200,
    };
    // Sequence: token fetch, first search, second search (no second token fetch)
    mockFetchSequence(
      TOKEN_RESP,
      { ok: true, body: { tracks: [track] } },
      { ok: true, body: { tracks: [track] } },
    );

    await searchTidal('first query');
    await searchTidal('second query');

    expect((fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3);
  });
});

describe('getTidalTrack', () => {
  it('returns null when credentials are missing', async () => {
    delete process.env.TIDAL_CLIENT_ID;
    const result = await getTidalTrack('123');
    expect(result).toBeNull();
    expect(fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('returns null when track request fails (non-ok)', async () => {
    mockFetchSequence(TOKEN_RESP, { ok: false, status: 404, body: {} });
    const result = await getTidalTrack('999');
    expect(result).toBeNull();
  });

  it('returns correctly mapped TidalTrack with top-level fields', async () => {
    const rawTrack = {
      id: 77,
      title: 'Sour Times',
      artists: [{ name: 'Portishead' }],
      album: { title: 'Dummy', imageCover: [{ url: 'https://img.example.com/sour.jpg' }] },
      duration: 255,
    };
    mockFetchSequence(TOKEN_RESP, { ok: true, body: rawTrack });

    const result = await getTidalTrack('77');

    expect(result).toMatchObject({
      id: '77',
      title: 'Sour Times',
      artist: 'Portishead',
      album: 'Dummy',
      artworkUrl: 'https://img.example.com/sour.jpg',
      duration: 255,
      url: 'https://tidal.com/browse/track/77',
    });
  });

  it('falls back to raw.attributes fields when top-level fields are absent', async () => {
    const rawTrack = {
      data: { id: '55' },
      attributes: {
        title: 'Roads',
        artists: [{ name: 'Portishead' }],
        duration: 300,
      },
    };
    mockFetchSequence(TOKEN_RESP, { ok: true, body: rawTrack });

    const result = await getTidalTrack('55');

    expect(result).toMatchObject({
      id: '55',
      title: 'Roads',
      artist: 'Portishead',
      duration: 300,
    });
  });
});
