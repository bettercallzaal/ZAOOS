// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPostCast = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/farcaster/neynar', () => ({ postCast: mockPostCast }));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));

// An in-memory stand-in for the channel_casts table. NOTHING writes to it except
// the code under test - there is no webhook here, which is the point.
const table = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  failUpsert: false,
}));
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => {
        const filters: Array<(r: Record<string, unknown>) => boolean> = [];
        const q = {
          eq: (col: string, val: unknown) => {
            filters.push((r) => r[col] === val);
            return q;
          },
          gte: (col: string, val: string) => {
            filters.push((r) => String(r[col]) >= val);
            return Promise.resolve({
              count: table.rows.filter((r) => filters.every((f) => f(r))).length,
              error: null,
            });
          },
        };
        return q;
      },
      upsert: (rows: Array<Record<string, unknown>>) => {
        if (table.failUpsert) return Promise.resolve({ error: { message: 'write refused' } });
        for (const row of rows) {
          if (!table.rows.some((r) => r.hash === row.hash)) table.rows.push(row);
        }
        return Promise.resolve({ error: null });
      },
    }),
  },
}));

import { autoCastToZao } from '../auto-cast';
import {
  autoCastDailyCap,
  checkAutoCastCap,
  recordOfficialCast,
  utcDayStart,
} from '../auto-cast-cap';

beforeEach(() => {
  vi.clearAllMocks();
  table.rows = [];
  table.failUpsert = false;
  delete process.env.FARCASTER_AUTOCAST_DAILY_CAP;
  delete process.env.ZAO_OFFICIAL_FID;
  delete process.env.ZAO_OFFICIAL_SIGNER_UUID;
  delete process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;
});

describe('autoCastDailyCap', () => {
  it.each([
    [undefined, null],
    ['', null],
    ['0', null],
    ['-3', null],
    ['true', null],
    ['2.5', null],
    ['5', 5],
    [' 12 ', 12],
  ])('reads %j as %j', (raw, want) => {
    if (raw === undefined) delete process.env.FARCASTER_AUTOCAST_DAILY_CAP;
    else process.env.FARCASTER_AUTOCAST_DAILY_CAP = raw;
    expect(autoCastDailyCap()).toBe(want);
  });
});

describe('utcDayStart', () => {
  it('returns midnight UTC of the same day', () => {
    expect(utcDayStart(new Date('2026-10-06T23:59:59.000Z'))).toBe('2026-10-06T00:00:00.000Z');
  });
});

describe('checkAutoCastCap', () => {
  it('is off by default and never counts', async () => {
    const counter = vi.fn();
    const d = await checkAutoCastCap('zao', { counter });
    expect(d).toEqual({ allowed: true, capped: false });
    expect(counter).not.toHaveBeenCalled();
  });

  it('allows a cast under the cap and passes the day start to the counter', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    process.env.ZAO_OFFICIAL_FID = '19640';
    const counter = vi.fn().mockResolvedValue(4);
    const d = await checkAutoCastCap('zao', { counter, now: new Date('2026-10-06T15:00:00.000Z') });
    expect(d).toEqual({ allowed: true, capped: true, used: 4, cap: 5 });
    expect(counter).toHaveBeenCalledWith('zao', 19640, '2026-10-06T00:00:00.000Z');
  });

  it('blocks at the cap', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    process.env.ZAO_OFFICIAL_FID = '19640';
    const d = await checkAutoCastCap('zao', { counter: vi.fn().mockResolvedValue(5) });
    expect(d).toMatchObject({ allowed: false, reason: 'daily cap reached', used: 5, cap: 5 });
  });

  it('fails closed when the count throws', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    process.env.ZAO_OFFICIAL_FID = '19640';
    const d = await checkAutoCastCap('zao', {
      counter: vi.fn().mockRejectedValue(new Error('db down')),
    });
    expect(d).toMatchObject({ allowed: false, reason: 'count failed' });
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('fails closed when the official fid is not configured', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    const counter = vi.fn();
    const d = await checkAutoCastCap('zao', { counter });
    expect(d).toMatchObject({ allowed: false, reason: 'official fid not configured' });
    expect(counter).not.toHaveBeenCalled();
  });
});

describe('autoCastToZao with the cap', () => {
  it('posts exactly as before when the flag is unset', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    mockPostCast.mockResolvedValue({ cast: { hash: 'hash-abc' } });
    expect(await autoCastToZao('hello')).toBe('hash-abc');
    expect(mockPostCast).toHaveBeenCalledTimes(1);
  });

  it('does not post when the cap is on and cannot be checked', async () => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    // No ZAO_OFFICIAL_FID: the cap fails closed before any database access.
    expect(await autoCastToZao('hello')).toBeNull();
    expect(mockPostCast).not.toHaveBeenCalled();
  });
});

describe('recordOfficialCast', () => {
  it('does nothing when the cap is off', async () => {
    const recorder = vi.fn();
    expect(await recordOfficialCast('zao', { hash: '0x1', text: 'hi' }, { recorder })).toBe(false);
    expect(recorder).not.toHaveBeenCalled();
  });

  it('writes the row the counter will read', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    process.env.ZAO_OFFICIAL_FID = '19640';
    const recorder = vi.fn().mockResolvedValue(undefined);
    const ok = await recordOfficialCast(
      'zao',
      { hash: '0x1', text: 'hi' },
      { recorder, now: new Date('2026-10-06T15:00:00.000Z') },
    );
    expect(ok).toBe(true);
    expect(recorder).toHaveBeenCalledWith({
      hash: '0x1',
      channel_id: 'zao',
      fid: 19640,
      text: 'hi',
      timestamp: '2026-10-06T15:00:00.000Z',
      embeds: [],
    });
  });

  it('logs and returns false when the write fails, without throwing', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    process.env.ZAO_OFFICIAL_FID = '19640';
    const recorder = vi.fn().mockRejectedValue(new Error('write refused'));
    expect(await recordOfficialCast('zao', { hash: '0x1', text: 'hi' }, { recorder })).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('logs when a sent cast has no hash to record', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '5';
    process.env.ZAO_OFFICIAL_FID = '19640';
    const recorder = vi.fn();
    expect(await recordOfficialCast('zao', { hash: null, text: 'hi' }, { recorder })).toBe(false);
    expect(recorder).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe('the cap when the webhook delivers nothing', () => {
  beforeEach(() => {
    process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
    process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
    process.env.ZAO_OFFICIAL_FID = '19640';
    let n = 0;
    mockPostCast.mockImplementation(async () => ({ cast: { hash: `0xhash${++n}` } }));
  });

  it('blocks the cast after the cap using only what the function itself recorded', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '2';
    expect(await autoCastToZao('one')).toBe('0xhash1');
    expect(await autoCastToZao('two')).toBe('0xhash2');
    expect(await autoCastToZao('three')).toBeNull();
    expect(mockPostCast).toHaveBeenCalledTimes(2);
    expect(table.rows.map((r) => r.hash)).toEqual(['0xhash1', '0xhash2']);
  });

  it('does not write to the table at all when the cap is off', async () => {
    expect(await autoCastToZao('one')).toBe('0xhash1');
    expect(await autoCastToZao('two')).toBe('0xhash2');
    expect(await autoCastToZao('three')).toBe('0xhash3');
    expect(table.rows).toEqual([]);
  });

  it('still returns the hash when recording fails, and says the cap will undercount', async () => {
    process.env.FARCASTER_AUTOCAST_DAILY_CAP = '2';
    table.failUpsert = true;
    expect(await autoCastToZao('one')).toBe('0xhash1');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
