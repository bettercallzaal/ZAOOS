// @vitest-environment node
// Tests jinaFetch and oembedFetch — the HTTP-layer exports of jina/reader.ts.
// detectPlatform tests live in reader.test.ts (PR #1633).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jinaFetch, oembedFetch } from '../reader';

function stubFetch(ok: boolean, body: { text?: string; json?: unknown } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      statusText: ok ? 'OK' : 'Internal Server Error',
      text: async () => body.text ?? '',
      json: async () => body.json ?? {},
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// jinaFetch
// ---------------------------------------------------------------------------

describe('jinaFetch', () => {
  it('throws for an empty string URL', async () => {
    await expect(jinaFetch('')).rejects.toThrow('Invalid URL provided');
  });

  it('throws for a non-OK HTTP response', async () => {
    stubFetch(false);
    await expect(jinaFetch('https://example.com')).rejects.toThrow('Jina Reader returned 500');
  });

  it('returns trimmed text on a successful response', async () => {
    stubFetch(true, { text: '  Hello Jina World  ' });
    const result = await jinaFetch('https://example.com');
    expect(result).toBe('Hello Jina World');
  });

  it('rethrows network errors (non-Abort) as-is', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unreachable')));
    await expect(jinaFetch('https://example.com')).rejects.toThrow('Network unreachable');
  });

  it('converts AbortError into a descriptive timeout message', async () => {
    const abortErr = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortErr));
    await expect(jinaFetch('https://example.com')).rejects.toThrow(
      'Jina Reader request timeout (10s)',
    );
  });
});

// ---------------------------------------------------------------------------
// oembedFetch
// ---------------------------------------------------------------------------

describe('oembedFetch', () => {
  it('returns null for an empty URL', async () => {
    expect(await oembedFetch('')).toBeNull();
  });

  it('builds a publish.x.com URL for X/Twitter links', async () => {
    stubFetch(true, { json: { title: 'Tweet', author_name: 'user', author_url: '' } });
    await oembedFetch('https://x.com/user/status/123');
    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain('publish.x.com/oembed');
  });

  it('builds a youtube.com URL for YouTube links', async () => {
    stubFetch(true, { json: { title: 'Video', author_name: 'ch', author_url: '' } });
    await oembedFetch('https://www.youtube.com/watch?v=abc');
    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain('www.youtube.com/oembed');
  });

  it('falls back to noembed.com for generic URLs', async () => {
    stubFetch(true, { json: { title: 'Page', author_name: '', author_url: '' } });
    await oembedFetch('https://example.com/article');
    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain('noembed.com/embed');
  });

  it('returns null on a non-OK oEmbed response', async () => {
    stubFetch(false);
    const result = await oembedFetch('https://x.com/user/status/1');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const result = await oembedFetch('https://example.com');
    expect(result).toBeNull();
  });

  it('normalises a valid oEmbed response into the OEmbedData shape', async () => {
    stubFetch(true, {
      json: {
        title: 'ZAO Community',
        author_name: 'zaal.eth',
        author_url: 'https://zaal.eth',
        thumbnail_url: 'https://img.example.com/thumb.jpg',
        html: '<iframe></iframe>',
      },
    });
    const result = await oembedFetch('https://example.com');
    expect(result).toMatchObject({
      title: 'ZAO Community',
      author_name: 'zaal.eth',
      author_url: 'https://zaal.eth',
      thumbnail_url: 'https://img.example.com/thumb.jpg',
      html: '<iframe></iframe>',
    });
  });
});
