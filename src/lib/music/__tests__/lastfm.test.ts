// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrobble, updateNowPlaying, getAuthUrl, getSession } from '../lastfm';

function mockFetch(status: number, body: unknown = {}) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(''),
  });
}

function getRequestBody(): Record<string, string> {
  const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
  return Object.fromEntries(new URLSearchParams(opts.body as string));
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  process.env.LASTFM_API_KEY = 'test-key';
  process.env.LASTFM_API_SECRET = 'test-secret';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.LASTFM_API_KEY;
  delete process.env.LASTFM_API_SECRET;
});

describe('scrobble', () => {
  it('POSTs to https://ws.audioscrobbler.com/2.0/', async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Artist', track: 'Track', timestamp: 1000, sk: 'sk-1' });
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://ws.audioscrobbler.com/2.0/');
  });

  it("sends method: 'track.scrobble' in body", async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Artist', track: 'Track', timestamp: 1000, sk: 'sk-1' });
    expect(getRequestBody().method).toBe('track.scrobble');
  });

  it('includes artist, track, timestamp, sk from params', async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Portishead', track: 'Glory Box', timestamp: 9999, sk: 'sk-xyz' });
    const body = getRequestBody();
    expect(body.artist).toBe('Portishead');
    expect(body.track).toBe('Glory Box');
    expect(body.timestamp).toBe('9999');
    expect(body.sk).toBe('sk-xyz');
  });

  it('includes album when provided', async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Artist', track: 'Track', album: 'Dummy', timestamp: 1000, sk: 'sk-1' });
    expect(getRequestBody().album).toBe('Dummy');
  });

  it('omits album field when not provided', async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Artist', track: 'Track', timestamp: 1000, sk: 'sk-1' });
    expect(getRequestBody()).not.toHaveProperty('album');
  });

  it("includes api_key: 'test-key' and format: 'json' in body", async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Artist', track: 'Track', timestamp: 1000, sk: 'sk-1' });
    const body = getRequestBody();
    expect(body.api_key).toBe('test-key');
    expect(body.format).toBe('json');
  });

  it('includes api_sig as a 32-char hex string', async () => {
    mockFetch(200, {});
    await scrobble({ artist: 'Artist', track: 'Track', timestamp: 1000, sk: 'sk-1' });
    const { api_sig } = getRequestBody();
    expect(api_sig).toMatch(/^[0-9a-f]{32}$/);
  });

  it('throws "Last.fm API error 403:" on non-ok response', async () => {
    mockFetch(403, {});
    await expect(
      scrobble({ artist: 'Artist', track: 'Track', timestamp: 1000, sk: 'sk-1' })
    ).rejects.toThrow('Last.fm API error 403:');
  });
});

describe('updateNowPlaying', () => {
  it("sends method: 'track.updateNowPlaying' in body", async () => {
    mockFetch(200, {});
    await updateNowPlaying({ artist: 'Artist', track: 'Track', sk: 'sk-1' });
    expect(getRequestBody().method).toBe('track.updateNowPlaying');
  });
});

describe('getAuthUrl', () => {
  it('returns URL containing api_key=test-key and encoded callback URL', () => {
    const callback = 'https://example.com/callback?foo=bar';
    const url = getAuthUrl(callback);
    expect(url).toContain('api_key=test-key');
    expect(url).toContain(encodeURIComponent(callback));
  });
});

describe('getSession', () => {
  it('returns result.session.key from the API response', async () => {
    mockFetch(200, { session: { key: 'sk-abc' } });
    const key = await getSession('token-123');
    expect(key).toBe('sk-abc');
  });
});
