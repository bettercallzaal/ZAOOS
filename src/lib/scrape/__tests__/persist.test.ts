// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock state the supabase mock reads from.
const state: { upsertError: unknown; selectData: unknown; selectError: unknown } = {
  upsertError: null,
  selectData: null,
  selectError: null,
};

const upsertSpy = vi.fn(async () => ({ error: state.upsertError }));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/db/supabase', () => {
  const maybeSingle = async () => ({ data: state.selectData, error: state.selectError });
  const eq = () => ({ eq: () => ({ maybeSingle }), maybeSingle });
  const select = () => ({ eq });
  const from = () => ({ upsert: upsertSpy, select });
  return { supabaseAdmin: { from } };
});

import { cacheScrape, getCachedScrape } from '../persist';

beforeEach(() => {
  state.upsertError = null;
  state.selectData = null;
  state.selectError = null;
  upsertSpy.mockClear();
});

describe('cacheScrape', () => {
  it('upserts and returns ok', async () => {
    const res = await cacheScrape('x', '123', { text: 'hi' });
    expect(res.ok).toBe(true);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    const [row, opts] = upsertSpy.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(row.source).toBe('x');
    expect(row.key).toBe('123');
    expect(row.data).toEqual({ text: 'hi' });
    expect(opts.onConflict).toBe('source,key');
  });

  it('returns an error result (not throwing) when the upsert errors', async () => {
    state.upsertError = { message: 'duplicate key' };
    const res = await cacheScrape('x', '123', {});
    expect(res.ok).toBe(false);
    expect(res.error).toBe('duplicate key');
  });

  it('rejects an empty key', async () => {
    const res = await cacheScrape('x', '', {});
    expect(res.ok).toBe(false);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe('getCachedScrape', () => {
  it('returns data and scrapedAt when present', async () => {
    state.selectData = { data: { wins: 5 }, scraped_at: '2026-06-18T00:00:00Z' };
    const res = await getCachedScrape<{ wins: number }>('wavewarz-artist', 'wallet');
    expect(res?.data.wins).toBe(5);
    expect(res?.scrapedAt).toBe('2026-06-18T00:00:00Z');
  });

  it('returns null when the row is missing', async () => {
    state.selectData = null;
    const res = await getCachedScrape('x', 'nope');
    expect(res).toBeNull();
  });

  it('returns null on a db error instead of throwing', async () => {
    state.selectError = { message: 'boom' };
    const res = await getCachedScrape('x', '123');
    expect(res).toBeNull();
  });
});
