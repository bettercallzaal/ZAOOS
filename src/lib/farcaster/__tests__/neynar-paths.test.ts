// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// neynar.ts reads ENV at import time, so the read-base case needs its own file.
vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
    FARCASTER_READ_API_BASE: 'https://read.example',
  },
}));

import {
  getBestFriends,
  getCastConversationSummary,
  getFollowSuggestions,
  getFrameCatalog,
  getRelevantFrames,
  getTrendingTopics,
  searchFrames,
} from '../neynar';

function res(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// Paths per Hypersnap src/api/http.rs and Neynar's OpenAPI spec, which agree (doc 2418 D3).
describe.each([
  ['getBestFriends', () => getBestFriends(3, 5), '/user/best_friends?fid=3&limit=5'],
  ['getTrendingTopics', () => getTrendingTopics(5), '/topic/trending?limit=5'],
  ['getFollowSuggestions', () => getFollowSuggestions(3, 5), '/following/suggested?fid=3&limit=5'],
])('%s', (_name, call, path) => {
  it('asks the read base for the path it serves', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await call()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://read.example/v2/farcaster${path}`);
  });

  it('fails over to the same path on Neynar', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(404, 'not found'))
      .mockResolvedValueOnce(res(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await call()).toEqual({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toBe(`https://api.neynar.com/v2/farcaster${path}`);
  });
});

describe('getCastConversationSummary', () => {
  // Verbatim haatz body for this path, 2026-10-22 (doc 2418 D3).
  const PLACEHOLDER = {
    summary: 'Conversation summaries require LLM integration which is not available on this node.',
  };

  it('goes straight to Neynar with the API key, never to the read base', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (url: string) =>
        url.startsWith('https://read.example')
          ? res(200, PLACEHOLDER)
          : res(200, { summary: 'real' }),
      );
    vi.stubGlobal('fetch', fetchMock);

    expect(await getCastConversationSummary('0xabc')).toEqual({ summary: 'real' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.neynar.com/v2/farcaster/cast/conversation/summary?identifier=0xabc&type=hash',
    );
    expect(fetchMock.mock.calls[0][1].headers['x-api-key']).toBe('test-neynar-key');
  });

  it('throws on a non-OK Neynar response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(500, 'boom')));
    await expect(getCastConversationSummary('0xabc')).rejects.toThrow(
      'Neynar cast conversation summary error 500',
    );
  });
});

// Hypersnap answers 501 on all three frame paths (src/api/http.rs; haatz 6 of 6, 2026-10-23).
describe.each([
  ['getFrameCatalog', () => getFrameCatalog(5, 'c1'), '/frame/catalog?limit=5&cursor=c1'],
  ['searchFrames', () => searchFrames('zao', 5), '/frame/search?q=zao&limit=5'],
  ['getRelevantFrames', () => getRelevantFrames(3, 5), '/frame/relevant?fid=3&limit=5'],
])('%s', (_name, call, path) => {
  it('goes straight to Neynar with the API key, never to the read base', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (url: string) =>
        url.startsWith('https://read.example')
          ? res(501, { message: 'not implemented' })
          : res(200, { frames: [] }),
      );
    vi.stubGlobal('fetch', fetchMock);

    expect(await call()).toEqual({ frames: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.neynar.com/v2/farcaster${path}`);
    expect(fetchMock.mock.calls[0][1].headers['x-api-key']).toBe('test-neynar-key');
  });

  it('throws on a non-OK Neynar response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(500, 'boom')));
    await expect(call()).rejects.toThrow('500');
  });
});
