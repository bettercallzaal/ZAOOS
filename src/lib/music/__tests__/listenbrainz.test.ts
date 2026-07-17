// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { submitListen, submitNowPlaying } from '../listenbrainz';

vi.stubGlobal('fetch', vi.fn());

const TOKEN = 'user-abc123';

function mockFetch(status: number, body: unknown = { status: 'ok' }) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function getCall() {
  return (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', vi.fn());
});

describe('submitListen', () => {
  it('POSTs to https://api.listenbrainz.org/1/submit-listens', async () => {
    mockFetch(200);
    await submitListen({ artist: 'Artist', track: 'Track', timestamp: 1000, userToken: TOKEN });
    const [url, init] = getCall();
    expect(url).toBe('https://api.listenbrainz.org/1/submit-listens');
    expect(init.method).toBe('POST');
  });

  it('includes Authorization: Token <userToken> header', async () => {
    mockFetch(200);
    await submitListen({ artist: 'Artist', track: 'Track', timestamp: 1000, userToken: TOKEN });
    const [, init] = getCall();
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Token ${TOKEN}`);
  });

  it('sends listen_type: "single" in body', async () => {
    mockFetch(200);
    await submitListen({ artist: 'Artist', track: 'Track', timestamp: 1000, userToken: TOKEN });
    const [, init] = getCall();
    const body = JSON.parse(init.body as string);
    expect(body.listen_type).toBe('single');
  });

  it('body contains listened_at, artist_name, track_name from params', async () => {
    mockFetch(200);
    await submitListen({ artist: 'Test Artist', track: 'Test Track', timestamp: 1234567890, userToken: TOKEN });
    const [, init] = getCall();
    const body = JSON.parse(init.body as string);
    const entry = body.payload[0];
    expect(entry.listened_at).toBe(1234567890);
    expect(entry.track_metadata.artist_name).toBe('Test Artist');
    expect(entry.track_metadata.track_name).toBe('Test Track');
  });

  it('includes release_name in track_metadata when album is provided', async () => {
    mockFetch(200);
    await submitListen({ artist: 'Artist', track: 'Track', album: 'My Album', timestamp: 1000, userToken: TOKEN });
    const [, init] = getCall();
    const body = JSON.parse(init.body as string);
    expect(body.payload[0].track_metadata.release_name).toBe('My Album');
  });

  it('omits release_name when album is absent', async () => {
    mockFetch(200);
    await submitListen({ artist: 'Artist', track: 'Track', timestamp: 1000, userToken: TOKEN });
    const [, init] = getCall();
    const body = JSON.parse(init.body as string);
    expect(body.payload[0].track_metadata).not.toHaveProperty('release_name');
  });

  it('returns parsed JSON on success', async () => {
    mockFetch(200, { status: 'ok' });
    const result = await submitListen({ artist: 'Artist', track: 'Track', timestamp: 1000, userToken: TOKEN });
    expect(result).toEqual({ status: 'ok' });
  });

  it('throws "ListenBrainz error 401: ..." on non-ok response', async () => {
    mockFetch(401, { error: 'Unauthorized' });
    await expect(
      submitListen({ artist: 'Artist', track: 'Track', timestamp: 1000, userToken: 'bad-token' })
    ).rejects.toThrow('ListenBrainz error 401:');
  });
});

describe('submitNowPlaying', () => {
  it('sends listen_type: "playing_now" in body', async () => {
    mockFetch(200);
    await submitNowPlaying({ artist: 'Artist', track: 'Track', userToken: TOKEN });
    const [, init] = getCall();
    const body = JSON.parse(init.body as string);
    expect(body.listen_type).toBe('playing_now');
  });

  it('does NOT include listened_at in the payload (only track_metadata)', async () => {
    mockFetch(200);
    await submitNowPlaying({ artist: 'Artist', track: 'Track', userToken: TOKEN });
    const [, init] = getCall();
    const body = JSON.parse(init.body as string);
    const entry = body.payload[0];
    expect(entry).not.toHaveProperty('listened_at');
    expect(entry).toHaveProperty('track_metadata');
  });
});
