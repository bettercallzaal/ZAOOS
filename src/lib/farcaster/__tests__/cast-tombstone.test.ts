// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockLimit = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'channel_casts') {
      return { select: () => ({ eq: () => ({ limit: mockLimit }) }) };
    }
    if (table === 'hidden_messages') return { upsert: mockUpsert };
    throw new Error(`unexpected table ${table}`);
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import {
  castTombstoneEnabled,
  parseDeletedCastHash,
  TOMBSTONE_REASON,
  tombstoneDeletedCast,
} from '../cast-tombstone';

const HASH = `0x${'ab'.repeat(20)}`;

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.NEYNAR_CAST_DELETED_TOMBSTONE;
});

describe('castTombstoneEnabled - default off', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('NEYNAR_CAST_DELETED_TOMBSTONE=%s -> %s', (value, want) => {
    if (value !== undefined) process.env.NEYNAR_CAST_DELETED_TOMBSTONE = value;
    expect(castTombstoneEnabled()).toBe(want);
  });
});

describe('parseDeletedCastHash', () => {
  it('returns the hash of a well-formed cast.deleted', () => {
    expect(parseDeletedCastHash({ type: 'cast.deleted', data: { hash: HASH, text: 'x' } })).toBe(
      HASH,
    );
  });

  it.each([
    ['another event type', { type: 'cast.created', data: { hash: HASH } }],
    ['no data', { type: 'cast.deleted' }],
    ['no hash', { type: 'cast.deleted', data: {} }],
    ['a hash without 0x', { type: 'cast.deleted', data: { hash: 'ab'.repeat(20) } }],
    ['a short hash', { type: 'cast.deleted', data: { hash: '0xabc' } }],
    ['not an object', 'cast.deleted'],
  ])('returns null for %s', (_name, payload) => {
    expect(parseDeletedCastHash(payload)).toBeNull();
  });
});

describe('tombstoneDeletedCast', () => {
  it('hides a cast we hold, as system (fid 0), without overwriting a moderator hide', async () => {
    mockLimit.mockResolvedValueOnce({ data: [{ hash: HASH }], error: null });
    mockUpsert.mockResolvedValueOnce({ error: null });
    await expect(tombstoneDeletedCast(HASH)).resolves.toEqual({ status: 'tombstoned', hash: HASH });
    expect(mockUpsert).toHaveBeenCalledWith(
      { cast_hash: HASH, hidden_by_fid: 0, reason: TOMBSTONE_REASON },
      { onConflict: 'cast_hash', ignoreDuplicates: true },
    );
  });

  it('writes nothing for a cast we never stored', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    await expect(tombstoneDeletedCast(HASH)).resolves.toEqual({ status: 'not-held', hash: HASH });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('reports a read error, writes nothing, does not throw', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'read boom' } });
    await expect(tombstoneDeletedCast(HASH)).resolves.toEqual({
      status: 'error',
      hash: HASH,
      error: 'read boom',
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('reports a write error, does not throw', async () => {
    mockLimit.mockResolvedValueOnce({ data: [{ hash: HASH }], error: null });
    mockUpsert.mockResolvedValueOnce({ error: { message: 'write boom' } });
    await expect(tombstoneDeletedCast(HASH)).resolves.toEqual({
      status: 'error',
      hash: HASH,
      error: 'write boom',
    });
  });
});
