// @vitest-environment node
// Tests for bluesky/client.ts excluding splitIntoThread (covered by splitThread.test.ts)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @atproto/api before any import so module-level RichText usage is captured
const mockDetectFacets = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockPost = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockUploadBlob = vi.hoisted(() => vi.fn());

vi.mock('@atproto/api', () => ({
  AtpAgent: vi.fn().mockImplementation(() => ({
    login: mockLogin,
    post: mockPost,
    uploadBlob: mockUploadBlob,
  })),
  RichText: vi.fn().mockImplementation(({ text }: { text: string }) => ({
    text,
    facets: [],
    detectFacets: mockDetectFacets,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import type { AtpAgent } from '@atproto/api';
import { postBlueskyThread, postToBluesky, uploadBlueskyImage } from '../client';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ── uploadBlueskyImage ──────────────────────────────────────────────────────

describe('uploadBlueskyImage', () => {
  function makeAgent() {
    return { uploadBlob: mockUploadBlob } as unknown as AtpAgent;
  }

  it('returns blob ref and mimeType on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue('image/png') },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      }),
    );
    mockUploadBlob.mockResolvedValue({ data: { blob: 'mock-blob' } });

    const result = await uploadBlueskyImage(makeAgent(), 'https://example.com/img.png');
    expect(result).toEqual({ blob: 'mock-blob', mimeType: 'image/png' });
  });

  it('falls back to image/jpeg when content-type header is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
      }),
    );
    mockUploadBlob.mockResolvedValue({ data: { blob: 'b' } });

    const result = await uploadBlueskyImage(makeAgent(), 'https://example.com/img');
    expect(result?.mimeType).toBe('image/jpeg');
  });

  it('returns null when fetch response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await uploadBlueskyImage(makeAgent(), 'https://example.com/img.png');
    expect(result).toBeNull();
  });

  it('returns null on fetch exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await uploadBlueskyImage(makeAgent(), 'https://example.com/img.png');
    expect(result).toBeNull();
  });
});

// ── postBlueskyThread ───────────────────────────────────────────────────────

describe('postBlueskyThread', () => {
  function makeAgent() {
    return { post: mockPost, detectFacets: mockDetectFacets } as unknown as AtpAgent;
  }

  beforeEach(() => {
    let call = 0;
    mockPost.mockImplementation(() => {
      call++;
      return Promise.resolve({ uri: `at://a/${call}`, cid: `cid${call}` });
    });
  });

  it('posts a single chunk and returns its URI', async () => {
    const uris = await postBlueskyThread(['Hello'], makeAgent());
    expect(uris).toEqual(['at://a/1']);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when texts array is empty', async () => {
    const uris = await postBlueskyThread([], makeAgent());
    expect(uris).toHaveLength(0);
  });

  it('posts multiple chunks with correct root/parent reply refs', async () => {
    const uris = await postBlueskyThread(['First', 'Second', 'Third'], makeAgent());
    expect(uris).toHaveLength(3);

    const calls = mockPost.mock.calls;
    // First post has no reply
    expect(calls[0][0].reply).toBeUndefined();
    // Second post: root = first, parent = first
    expect(calls[1][0].reply).toEqual({
      root: { uri: 'at://a/1', cid: 'cid1' },
      parent: { uri: 'at://a/1', cid: 'cid1' },
    });
    // Third post: root = first, parent = second
    expect(calls[2][0].reply).toEqual({
      root: { uri: 'at://a/1', cid: 'cid1' },
      parent: { uri: 'at://a/2', cid: 'cid2' },
    });
  });
});

// ── postToBluesky ───────────────────────────────────────────────────────────

describe('postToBluesky', () => {
  beforeEach(() => {
    // Reset env state — community agent not configured by default
    delete process.env.BLUESKY_HANDLE;
    delete process.env.BLUESKY_APP_PASSWORD;
  });

  it('returns null when no community agent configured and no userCredentials', async () => {
    const result = await postToBluesky('Hello!');
    expect(result).toBeNull();
  });

  it('posts a short text via user credentials and returns URI', async () => {
    mockLogin.mockResolvedValue({});
    mockPost.mockResolvedValue({ uri: 'at://user/1', cid: 'cid1' });

    const result = await postToBluesky('Hello Bluesky!', undefined, {
      handle: 'user.bsky.social',
      appPassword: 'app-pw',
    });
    expect(result).toBe('at://user/1');
    expect(mockLogin).toHaveBeenCalledWith({
      identifier: 'user.bsky.social',
      password: 'app-pw',
    });
  });

  it('returns null when user agent login fails', async () => {
    mockLogin.mockRejectedValue(new Error('auth failed'));

    const result = await postToBluesky('Hello', undefined, {
      handle: 'bad.bsky.social',
      appPassword: 'wrong',
    });
    expect(result).toBeNull();
  });

  it('appends linkUrl to short text when no embedUrl', async () => {
    mockLogin.mockResolvedValue({});
    mockPost.mockResolvedValue({ uri: 'at://user/1', cid: 'cid1' });

    await postToBluesky('Check this out', 'https://example.com', {
      handle: 'user.bsky.social',
      appPassword: 'pw',
    });

    const postedText = mockPost.mock.calls[0][0].text;
    expect(postedText).toContain('Check this out');
    expect(postedText).toContain('https://example.com');
  });
});
