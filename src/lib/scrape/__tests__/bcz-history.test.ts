// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  paginateCasts,
  scrapeBczFarcasterHistory,
  resolveFarcasterFid,
  scrapeFarcasterHistoryByUsername,
  BczScrapeError,
  type FetchCastPage,
  type CastPage,
} from '../bcz-history';
import type { FetchImpl } from '../x-fetch';

/** Route a fake fetch by URL substring to a JSON/status response. */
function routedFetch(routes: Array<{ match: string; status?: number; json?: unknown }>): FetchImpl {
  return (async (url: string | URL | Request) => {
    const href = typeof url === 'string' ? url : url.toString();
    const r = routes.find((x) => href.includes(x.match));
    if (!r) throw new Error(`no route for ${href}`);
    return { ok: (r.status ?? 200) < 400, status: r.status ?? 200, json: async () => r.json } as Response;
  }) as unknown as FetchImpl;
}

function rawCast(hash: string, text: string, likes = 0): unknown {
  return {
    hash,
    text,
    timestamp: '2026-06-17T00:00:00Z',
    reactions: { likes_count: likes, recasts_count: 1 },
    replies: { count: 2 },
  };
}

/** A fake page fetcher backed by an in-memory list of pages. */
function pagedFetcher(pages: CastPage[]): FetchCastPage {
  let i = 0;
  return async () => {
    const page = pages[i] ?? { casts: [], nextCursor: null };
    i += 1;
    return page;
  };
}

describe('paginateCasts', () => {
  it('follows cursors across pages and normalizes casts', async () => {
    const fetchPage = pagedFetcher([
      { casts: [rawCast('0xa', 'first', 5)], nextCursor: 'c1' },
      { casts: [rawCast('0xb', 'second')], nextCursor: 'c2' },
      { casts: [rawCast('0xc', 'third')], nextCursor: null },
    ]);
    const { casts, truncated } = await paginateCasts(fetchPage);
    expect(casts.map((c) => c.hash)).toEqual(['0xa', '0xb', '0xc']);
    expect(casts[0].likes).toBe(5);
    expect(casts[0].recasts).toBe(1);
    expect(casts[0].replies).toBe(2);
    expect(truncated).toBe(false);
  });

  it('dedupes casts that appear on multiple pages', async () => {
    const fetchPage = pagedFetcher([
      { casts: [rawCast('0xa', 'first'), rawCast('0xb', 'second')], nextCursor: 'c1' },
      { casts: [rawCast('0xb', 'second-dup'), rawCast('0xc', 'third')], nextCursor: null },
    ]);
    const { casts } = await paginateCasts(fetchPage);
    expect(casts.map((c) => c.hash)).toEqual(['0xa', '0xb', '0xc']);
  });

  it('marks truncated when maxPages is hit with a pending cursor', async () => {
    const fetchPage = pagedFetcher([
      { casts: [rawCast('0xa', 'a')], nextCursor: 'c1' },
      { casts: [rawCast('0xb', 'b')], nextCursor: 'c2' },
    ]);
    const { casts, truncated } = await paginateCasts(fetchPage, { maxPages: 2 });
    expect(casts).toHaveLength(2);
    expect(truncated).toBe(true);
  });

  it('skips malformed casts without throwing', async () => {
    const fetchPage = pagedFetcher([
      { casts: [{ no_hash: true }, rawCast('0xa', 'good')], nextCursor: null },
    ]);
    const { casts } = await paginateCasts(fetchPage);
    expect(casts.map((c) => c.hash)).toEqual(['0xa']);
  });
});

describe('scrapeBczFarcasterHistory', () => {
  it('returns full normalized history with a custom fetchPage', async () => {
    const fetchPage = pagedFetcher([
      { casts: [rawCast('0xa', 'one'), rawCast('0xb', 'two')], nextCursor: null },
    ]);
    const history = await scrapeBczFarcasterHistory(3, { fetchPage });
    expect(history.fid).toBe(3);
    expect(history.total).toBe(2);
    expect(history.truncated).toBe(false);
  });

  it('throws on invalid fid', async () => {
    await expect(scrapeBczFarcasterHistory(0, { fetchPage: pagedFetcher([]) })).rejects.toBeInstanceOf(
      BczScrapeError,
    );
  });

  it('throws when neither fetchPage nor apiKey is provided', async () => {
    await expect(scrapeBczFarcasterHistory(3)).rejects.toBeInstanceOf(BczScrapeError);
  });
});
describe('resolveFarcasterFid', () => {
  it('resolves a username to its fid', async () => {
    const fetchImpl = routedFetch([{ match: 'by_username', json: { user: { fid: 8513 } } }]);
    const fid = await resolveFarcasterFid('bettercallzaal', 'key', fetchImpl);
    expect(fid).toBe(8513);
  });

  it('strips a leading @ from the handle', async () => {
    let seen = '';
    const fetchImpl = (async (url: string) => {
      seen = url;
      return { ok: true, status: 200, json: async () => ({ user: { fid: 1 } }) } as Response;
    }) as unknown as FetchImpl;
    await resolveFarcasterFid('@dwr', 'key', fetchImpl);
    expect(seen).toContain('username=dwr');
  });

  it('returns null for a non-existent username (404)', async () => {
    const fetchImpl = routedFetch([{ match: 'by_username', status: 404 }]);
    expect(await resolveFarcasterFid('nope', 'key', fetchImpl)).toBeNull();
  });

  it('returns null for empty input', async () => {
    const fetchImpl = routedFetch([]);
    expect(await resolveFarcasterFid('  ', 'key', fetchImpl)).toBeNull();
  });
});

describe('scrapeFarcasterHistoryByUsername', () => {
  it('resolves then scrapes full history', async () => {
    const fetchImpl = routedFetch([
      { match: 'by_username', json: { user: { fid: 8513 } } },
      { match: 'feed/user/casts', json: { casts: [rawCast('0xa', 'gm')], next: { cursor: null } } },
    ]);
    const history = await scrapeFarcasterHistoryByUsername('bettercallzaal', { apiKey: 'key', fetchImpl });
    expect(history.fid).toBe(8513);
    expect(history.total).toBe(1);
  });

  it('throws when the username cannot be resolved', async () => {
    const fetchImpl = routedFetch([{ match: 'by_username', status: 404 }]);
    await expect(
      scrapeFarcasterHistoryByUsername('nope', { apiKey: 'key', fetchImpl }),
    ).rejects.toBeInstanceOf(BczScrapeError);
  });
});
