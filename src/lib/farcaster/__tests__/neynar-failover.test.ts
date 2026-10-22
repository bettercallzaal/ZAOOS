// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// neynar.ts reads ENV at import time, so the read-base case needs its own file.
vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
    FARCASTER_READ_API_BASE: 'https://read.example',
  },
}));

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getTrendingFeed, getTrendingTopics, getUsersByFids } from '../neynar';

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
  clone: () => FakeResponse;
}

function res(status: number, body: unknown): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: () => res(status, body),
  };
}

const READ_URL = 'https://read.example/v2/farcaster/user/bulk?fids=1';
const NEYNAR_URL = 'https://api.neynar.com/v2/farcaster/user/bulk?fids=1';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('fetchWithFailover with a read base set', () => {
  it('serves from the read base on 200, without Neynar and without a log line', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { users: [{ fid: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([{ fid: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(READ_URL);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    404, 503,
  ])('falls back to Neynar with the API key on read-base %i and logs it', async (status) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(status, 'nope'))
      .mockResolvedValueOnce(res(200, { users: [{ fid: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([{ fid: 1 }]);
    expect(fetchMock.mock.calls[1][0]).toBe(NEYNAR_URL);
    expect(fetchMock.mock.calls[1][1].headers['x-api-key']).toBe('test-neynar-key');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      `[neynar/failover] /user/bulk read base returned ${status}, falling back to Neynar`,
    );
  });

  it('falls back to Neynar when the read base throws and logs the error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(res(200, { users: [{ fid: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([{ fid: 1 }]);
    expect(fetchMock.mock.calls[1][0]).toBe(NEYNAR_URL);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      '[neynar/failover] /user/bulk read base threw (ECONNREFUSED), falling back to Neynar',
    );
  });

  it('throws when both are down, after one failover log line', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(503, 'down'))
      .mockResolvedValueOnce(res(500, 'also down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getUsersByFids([1])).rejects.toThrow('Neynar bulk user error 500');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('fetchWithFailover with a list key (empty 200)', () => {
  // Real Responses: their body reads once, so a check that skips clone() leaves the
  // caller nothing to read (the fake res() above can be read twice and would hide that)
  const real = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

  const READ_TOPICS = 'https://read.example/v2/farcaster/topic/trending?limit=10';
  const NEYNAR_TOPICS = 'https://api.neynar.com/v2/farcaster/topic/trending?limit=10';

  it('falls back to Neynar when the read base answers 200 with an empty topics list', async () => {
    // Verbatim haatz body for topic/trending, 2026-10-22 (doc 2418)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(real(200, { next: { cursor: null }, topics: [] }))
      .mockResolvedValueOnce(real(200, { topics: [{ topic: 'music' }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getTrendingTopics()).toEqual({ topics: [{ topic: 'music' }] });
    expect(fetchMock.mock.calls[0][0]).toBe(READ_TOPICS);
    expect(fetchMock.mock.calls[1][0]).toBe(NEYNAR_TOPICS);
    expect(fetchMock.mock.calls[1][1].headers['x-api-key']).toBe('test-neynar-key');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      '[neynar/failover] /topic/trending read base returned an empty "topics" list, falling back to Neynar',
    );
  });

  it('keeps a non-empty topics list from the read base', async () => {
    const fetchMock = vi.fn().mockResolvedValue(real(200, { topics: [{ topic: 'zao' }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getTrendingTopics()).toEqual({ topics: [{ topic: 'zao' }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not fail over on an empty list for a call without a list key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(real(200, { users: [] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('fetchWithFailover keeps a page cursor on the base that issued it', () => {
  const real = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  const READ = 'https://read.example/v2/farcaster/feed/trending';
  const NEYNAR = 'https://api.neynar.com/v2/farcaster/feed/trending';
  const urls = (m: ReturnType<typeof vi.fn>) => m.mock.calls.map((c) => String(c[0]));

  it('tags a read-base next.cursor with rb.', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(real(200, { casts: [{}], next: { cursor: 'abc' } })),
    );
    const page = await getTrendingFeed();
    expect(page.next.cursor).toBe('rb.abc');
  });

  it('sends a tagged cursor to the read base, untagged, and not to Neynar', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(real(200, { casts: [{}], next: { cursor: 'def' } }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await getTrendingFeed(25, '24h', 'rb.abc');
    expect(urls(fetchMock)).toEqual([`${READ}?limit=25&time_window=24h&cursor=abc`]);
    expect(page.next.cursor).toBe('rb.def');
  });

  it.each([
    ['503', () => vi.fn().mockResolvedValue(real(503, 'down')), 'error 503'],
    ['a throw', () => vi.fn().mockRejectedValue(new Error('ECONNRESET')), 'error 502'],
  ])('fails instead of giving Neynar a read-base cursor when the read base answers %s', async (_n, make, msg) => {
    const fetchMock = make();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTrendingFeed(25, '24h', 'rb.abc')).rejects.toThrow(msg);
    expect(urls(fetchMock).some((u) => u.startsWith(NEYNAR))).toBe(false);
    expect(warn.mock.calls.at(-1)?.[0]).toBe(
      '[neynar/failover] /feed/trending page cursor is from the read base, not sent to Neynar',
    );
  });

  it('sends an untagged (Neynar) cursor straight to Neynar with the key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(real(200, { casts: [{}], next: { cursor: 'n2' } }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await getTrendingFeed(25, '24h', 'n1');
    expect(urls(fetchMock)).toEqual([`${NEYNAR}?limit=25&time_window=24h&cursor=n1`]);
    expect(fetchMock.mock.calls[0][1].headers['x-api-key']).toBe('test-neynar-key');
    expect(page.next.cursor).toBe('n2');
  });

  it('leaves a Neynar cursor untagged after a first-page failover', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(real(503, 'down'))
      .mockResolvedValueOnce(real(200, { casts: [{}], next: { cursor: 'n1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await getTrendingFeed();
    expect(urls(fetchMock)[1]).toBe(`${NEYNAR}?limit=25&time_window=24h`);
    expect(page.next.cursor).toBe('n1');
  });
});
