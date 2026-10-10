import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockLoggerError } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockLoggerError: vi.fn(),
}));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: mockLoggerError, warn: vi.fn(), info: vi.fn() },
}));

import { dropHiddenCasts, hiddenCastsEverywhereEnabled } from '@/lib/farcaster/hidden-casts';

const FLAG = 'HIDDEN_CASTS_EVERYWHERE';
const rows = [{ hash: '0xaa' }, { hash: '0xbb' }, { hash: '0xcc' }];

/** hidden_messages chain: .select().in() resolves the given result. */
function hiddenChain(result: { data: unknown; error: unknown }) {
  const inFn = vi.fn().mockResolvedValue(result);
  return { chain: { select: vi.fn().mockReturnValue({ in: inFn }) }, inFn };
}

describe('hidden-casts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env[FLAG];
  });
  afterEach(() => {
    delete process.env[FLAG];
  });

  describe.each([
    [undefined, false],
    ['', false],
    ['0', false],
    ['true', false],
    ['on', false],
    [' 1', false],
    ['1', true],
  ])('flag value %j', (value, expected) => {
    it(`enabled is ${expected}`, () => {
      if (value === undefined) delete process.env[FLAG];
      else process.env[FLAG] = value;
      expect(hiddenCastsEverywhereEnabled()).toBe(expected);
    });
  });

  it('flag off: returns the same rows and makes no query', async () => {
    const out = await dropHiddenCasts(rows, 'test');
    expect(out).toBe(rows);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('flag on, no rows: makes no query', async () => {
    process.env[FLAG] = '1';
    expect(await dropHiddenCasts([], 'test')).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('flag on: drops only the hashes listed in hidden_messages', async () => {
    process.env[FLAG] = '1';
    const { chain, inFn } = hiddenChain({ data: [{ cast_hash: '0xbb' }], error: null });
    mockFrom.mockReturnValue(chain);
    const out = await dropHiddenCasts(rows, 'test');
    expect(out).toEqual([{ hash: '0xaa' }, { hash: '0xcc' }]);
    expect(mockFrom).toHaveBeenCalledWith('hidden_messages');
    expect(inFn).toHaveBeenCalledWith('cast_hash', ['0xaa', '0xbb', '0xcc']);
  });

  it('flag on, nothing hidden: keeps every row', async () => {
    process.env[FLAG] = '1';
    mockFrom.mockReturnValue(hiddenChain({ data: [], error: null }).chain);
    expect(await dropHiddenCasts(rows, 'test')).toEqual(rows);
  });

  it('flag on, hidden_messages returns an error: no casts, and it is logged', async () => {
    process.env[FLAG] = '1';
    mockFrom.mockReturnValue(hiddenChain({ data: null, error: { message: 'boom' } }).chain);
    expect(await dropHiddenCasts(rows, 'search')).toEqual([]);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(String(mockLoggerError.mock.calls[0][0])).toContain('search');
  });

  it('flag on, the query throws: no casts, never rejects', async () => {
    process.env[FLAG] = '1';
    mockFrom.mockImplementation(() => {
      throw new Error('down');
    });
    await expect(dropHiddenCasts(rows, 'test')).resolves.toEqual([]);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
