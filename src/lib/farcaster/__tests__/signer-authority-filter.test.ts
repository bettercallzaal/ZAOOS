// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockProvenanceIn = vi.hoisted(() => vi.fn());
const mockAuthorityIn = vi.hoisted(() => vi.fn());
// The authority read is .in('fid', ...).in('signer', ...): two links, both recorded.
const mockAuthorityFidIn = vi.hoisted(() => vi.fn(() => ({ in: mockAuthorityIn })));
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'cast_signer_provenance') return { select: () => ({ in: mockProvenanceIn }) };
    if (table === 'farcaster_signer_authority') {
      return { select: () => ({ in: mockAuthorityFidIn }) };
    }
    throw new Error(`unexpected table ${table}`);
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import {
  dropCastsBySignerAuthority,
  signerAuthorityFilterEnabled,
} from '../signer-authority-filter';

const FLAG = 'FARCASTER_SIGNER_AUTHORITY_FILTER';
const FID = 3;
const C1 = `0x${'a1'.repeat(20)}`;
const C2 = `0x${'b2'.repeat(20)}`;
const C3 = `0x${'c3'.repeat(20)}`;
const KEY_A = `0x${'aa'.repeat(32)}`;
const KEY_B = `0x${'bb'.repeat(32)}`;

const rows = [{ hash: C1 }, { hash: C2 }, { hash: C3 }];
const prov = (cast_hash: string, signer: string, fid = FID) => ({ cast_hash, fid, signer });
const auth = (signer: string, status: string, fid = FID) => ({ fid, signer, status });

/** Stored state: which key signed which cast, and each key's authority. */
function store(provenance: unknown[], authority: unknown[]) {
  mockProvenanceIn.mockResolvedValueOnce({ data: provenance, error: null });
  mockAuthorityIn.mockResolvedValueOnce({ data: authority, error: null });
}
const hashes = (out: Array<{ hash: string }>) => out.map((r) => r.hash);

afterEach(() => {
  vi.clearAllMocks();
  delete process.env[FLAG];
});

describe('signerAuthorityFilterEnabled - default off', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('FARCASTER_SIGNER_AUTHORITY_FILTER=%s -> %s', (value, want) => {
    if (value !== undefined) process.env[FLAG] = value;
    expect(signerAuthorityFilterEnabled()).toBe(want);
  });
});

describe('dropCastsBySignerAuthority', () => {
  it('flag off: returns the same rows and makes no query', async () => {
    const out = await dropCastsBySignerAuthority(rows, 'test', { unknown: 'drop' });
    expect(out).toBe(rows);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('flag on, no rows: makes no query', async () => {
    process.env[FLAG] = '1';
    expect(await dropCastsBySignerAuthority([], 'test', { unknown: 'drop' })).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  describe.each([['keep' as const], ['drop' as const]])("unknown: '%s'", (unknown) => {
    it('keeps a cast whose signer is active and drops one whose signer was removed', async () => {
      process.env[FLAG] = '1';
      store(
        [prov(C1, KEY_A), prov(C2, KEY_B), prov(C3, KEY_A)],
        [auth(KEY_A, 'active'), auth(KEY_B, 'removed')],
      );
      const out = await dropCastsBySignerAuthority(rows, 'test', { unknown });
      expect(hashes(out)).toEqual([C1, C3]);
    });
  });

  it.each([
    ['a cast with no provenance row', [prov(C1, KEY_A)], [auth(KEY_A, 'active')]],
    ['a signer with no authority row', [prov(C1, KEY_A), prov(C2, KEY_B)], [auth(KEY_A, 'active')]],
    [
      'a signer whose authority is unknown',
      [prov(C1, KEY_A), prov(C2, KEY_B)],
      [auth(KEY_A, 'active'), auth(KEY_B, 'unknown')],
    ],
    [
      'a status value this code does not know',
      [prov(C1, KEY_A), prov(C2, KEY_B)],
      [auth(KEY_A, 'active'), auth(KEY_B, 'suspended')],
    ],
    [
      'an authority row for the same key under another FID',
      [prov(C1, KEY_A), prov(C2, KEY_B)],
      [auth(KEY_A, 'active'), auth(KEY_B, 'active', 999)],
    ],
  ])('%s is unknown: kept on a display surface, dropped from a current-authority one', async (_n, p, a) => {
    process.env[FLAG] = '1';
    const two = [{ hash: C1 }, { hash: C2 }];
    store(p, a);
    expect(hashes(await dropCastsBySignerAuthority(two, 'test', { unknown: 'keep' }))).toEqual([
      C1,
      C2,
    ]);
    store(p, a);
    expect(hashes(await dropCastsBySignerAuthority(two, 'test', { unknown: 'drop' }))).toEqual([
      C1,
    ]);
  });

  it("signer A's removal does not drop a cast that active signer B also signed", async () => {
    process.env[FLAG] = '1';
    store(
      [prov(C1, KEY_A), prov(C1, KEY_B), prov(C2, KEY_A)],
      [auth(KEY_A, 'removed'), auth(KEY_B, 'active')],
    );
    const out = await dropCastsBySignerAuthority([{ hash: C1 }, { hash: C2 }], 'test', {
      unknown: 'keep',
    });
    expect(hashes(out)).toEqual([C1]);
  });

  it('a removed signer plus an unknown one is still removed, even when unknown is kept', async () => {
    process.env[FLAG] = '1';
    store([prov(C1, KEY_A), prov(C1, KEY_B)], [auth(KEY_A, 'removed')]);
    expect(await dropCastsBySignerAuthority([{ hash: C1 }], 'test', { unknown: 'keep' })).toEqual(
      [],
    );
  });

  it('matches a row whose hash is uppercase against lowercase provenance', async () => {
    process.env[FLAG] = '1';
    const upper = `0x${'A1'.repeat(20)}`;
    store([prov(C1, KEY_A)], [auth(KEY_A, 'removed')]);
    expect(
      await dropCastsBySignerAuthority([{ hash: upper }], 'test', { unknown: 'keep' }),
    ).toEqual([]);
    expect(mockProvenanceIn).toHaveBeenCalledWith('cast_hash', [C1]);
  });

  it('reads authority only for the FIDs and keys on this page', async () => {
    process.env[FLAG] = '1';
    store(
      [prov(C1, KEY_A), prov(C2, KEY_B, 7), prov(C3, KEY_A)],
      [auth(KEY_A, 'active'), auth(KEY_B, 'removed', 7)],
    );
    const out = await dropCastsBySignerAuthority(rows, 'test', { unknown: 'keep' });
    expect(hashes(out)).toEqual([C1, C3]);
    expect(mockAuthorityFidIn).toHaveBeenCalledWith('fid', [FID, 7]);
    expect(mockAuthorityIn).toHaveBeenCalledWith('signer', [KEY_A, KEY_B]);
  });

  it('with no provenance at all, asks nothing of the authority table', async () => {
    process.env[FLAG] = '1';
    mockProvenanceIn.mockResolvedValueOnce({ data: [], error: null });
    expect(hashes(await dropCastsBySignerAuthority(rows, 'test', { unknown: 'keep' }))).toEqual([
      C1,
      C2,
      C3,
    ]);
    expect(mockAuthorityIn).not.toHaveBeenCalled();
  });

  it('fails closed when the provenance table cannot be read', async () => {
    process.env[FLAG] = '1';
    mockProvenanceIn.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    expect(await dropCastsBySignerAuthority(rows, 'test', { unknown: 'keep' })).toEqual([]);
  });

  it('fails closed when the authority table cannot be read', async () => {
    process.env[FLAG] = '1';
    mockProvenanceIn.mockResolvedValueOnce({ data: [prov(C1, KEY_A)], error: null });
    mockAuthorityIn.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    expect(await dropCastsBySignerAuthority(rows, 'test', { unknown: 'keep' })).toEqual([]);
  });

  it('fails closed, without throwing, when the database client throws', async () => {
    process.env[FLAG] = '1';
    mockProvenanceIn.mockRejectedValueOnce(new Error('connection reset'));
    await expect(dropCastsBySignerAuthority(rows, 'test', { unknown: 'keep' })).resolves.toEqual(
      [],
    );
  });
});
