import { describe, it, expect } from 'vitest';
import {
  paginateCasts,
  scrapeBczFarcasterHistory,
  BczScrapeError,
  type FetchCastPage,
  type CastPage,
} from '../bcz-history';

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
