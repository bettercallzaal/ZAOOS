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
  getChannelFeed,
  getFollowSuggestions,
  getTrendingTopics,
  sortCastsNewestFirst,
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

describe('getChannelFeed on a read-base page', () => {
  // Verbatim timestamp order from haatz feed/channels?channel_ids=zao&limit=5, 2026-10-23:
  // 9 casts, one shard's 5 then the other's 4 (doc 2418, UPDATE 2026-10-23).
  const MEASURED = [
    '2026-10-10T12:48:59.000Z',
    '2026-10-05T17:43:58.000Z',
    '2026-10-05T14:40:30.000Z',
    '2026-10-02T16:18:58.000Z',
    '2026-09-30T14:28:29.000Z',
    '2026-10-23T15:28:06.000Z',
    '2026-10-23T00:43:39.000Z',
    '2026-10-22T01:52:18.000Z',
    '2026-10-21T21:03:40.000Z',
  ];
  const casts = MEASURED.map((timestamp, i) => ({ hash: `0x${i}`, timestamp }));

  it('sorts newest-first and keeps every cast and the cursor', async () => {
    const body = { casts, next: { cursor: 'shard-tokens' } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
    );

    const data = await getChannelFeed('zao', undefined, 5);
    const got = data.casts.map((c: { timestamp: string }) => c.timestamp);
    expect(got).toEqual([...MEASURED].sort().reverse());
    expect(got).toHaveLength(9);
    expect(data.next).toEqual({ cursor: 'shard-tokens' });
  });
});

describe('sortCastsNewestFirst', () => {
  it('leaves an already newest-first page in the same order', () => {
    const page = [
      { hash: 'a', timestamp: '2026-10-23T00:00:00Z' },
      { hash: 'b', timestamp: '2026-10-22T00:00:00Z' },
    ];
    expect(sortCastsNewestFirst(page)).toEqual(page);
  });

  it('puts a cast with no readable timestamp last and does not mutate the input', () => {
    const page = [{ hash: 'x' }, { hash: 'y', timestamp: '2026-10-23T00:00:00Z' }];
    expect(sortCastsNewestFirst(page).map((c) => c.hash)).toEqual(['y', 'x']);
    expect(page.map((c) => c.hash)).toEqual(['x', 'y']);
  });
});
