// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPostCast = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/farcaster/neynar', () => ({ postCast: mockPostCast }));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));

import { autoCastToZao } from '../auto-cast';
import { autoCastDailyCap, checkAutoCastCap, utcDayStart } from '../auto-cast-cap';

beforeEach(() => {
  vi.clearAllMocks();
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
