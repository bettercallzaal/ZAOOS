// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Supabase chain mock — each method returns the chain for chaining
const chain = {
  select: vi.fn(),
  eq: vi.fn(),
  contains: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
};

Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));

const mockFrom = vi.hoisted(() => vi.fn(() => chain));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { AllowlistLookupError, checkAllowlist } from '../allowlist';

const MOCK_ENTRY = {
  id: 'entry-uuid-1',
  fid: 42,
  wallet_address: '0xabc123',
  custody_address: '0xcustody',
  verified_addresses: ['0xverified'],
  is_active: true,
};

function mockHit(entry = MOCK_ENTRY) {
  chain.maybeSingle.mockResolvedValueOnce({ data: entry, error: null });
}

function mockMiss() {
  chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));
  mockFrom.mockReturnValue(chain);
});

// ---------------------------------------------------------------------------
// Guard: no identifiers
// ---------------------------------------------------------------------------
describe('no identifiers', () => {
  it('returns { allowed: false } when neither fid nor walletAddress is provided', async () => {
    const result = await checkAllowlist();
    expect(result).toEqual({ allowed: false });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// FID lookup (fast path)
// ---------------------------------------------------------------------------
describe('FID lookup', () => {
  it('returns { allowed: true, entry } on FID match in allowlist', async () => {
    mockHit();
    const result = await checkAllowlist(42);
    expect(result.allowed).toBe(true);
    expect(result.entry).toEqual(MOCK_ENTRY);
    expect(chain.eq).toHaveBeenCalledWith('fid', 42);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('falls through to users table when allowlist has no FID match', async () => {
    mockMiss(); // allowlist FID miss
    mockHit({ id: 'user-1', primary_wallet: '0xabc' }); // users table hit
    const result = await checkAllowlist(99);
    expect(result.allowed).toBe(true);
    // First call was allowlist, second was users
    expect(mockFrom).toHaveBeenCalledWith('allowlist');
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('returns { allowed: false } when FID matches nothing', async () => {
    mockMiss(); // allowlist miss
    mockMiss(); // users table miss
    const result = await checkAllowlist(999);
    expect(result).toEqual({ allowed: false });
  });
});

// ---------------------------------------------------------------------------
// Wallet lookup — three fields checked in order
// ---------------------------------------------------------------------------
describe('wallet lookup', () => {
  it('returns { allowed: true, entry } on primary wallet_address match', async () => {
    mockHit();
    const result = await checkAllowlist(undefined, '0xABC123');
    expect(result.allowed).toBe(true);
    // wallet address must be lowercased
    expect(chain.eq).toHaveBeenCalledWith('wallet_address', '0xabc123');
  });

  it('normalizes wallet address to lowercase before querying', async () => {
    mockHit();
    await checkAllowlist(undefined, '0xMIXEDCASE');
    expect(chain.eq).toHaveBeenCalledWith('wallet_address', '0xmixedcase');
  });

  it('checks custody_address when primary wallet misses', async () => {
    mockMiss(); // primary wallet miss
    mockHit(); // custody match
    const result = await checkAllowlist(undefined, '0xcustody');
    expect(result.allowed).toBe(true);
    expect(chain.eq).toHaveBeenCalledWith('custody_address', '0xcustody');
  });

  it('checks verified_addresses JSONB array when primary and custody miss', async () => {
    mockMiss(); // primary wallet miss
    mockMiss(); // custody miss
    mockHit(); // verified_addresses match
    const result = await checkAllowlist(undefined, '0xverified');
    expect(result.allowed).toBe(true);
    expect(chain.contains).toHaveBeenCalledWith('verified_addresses', ['0xverified']);
  });

  it('falls through to users table when all wallet fields miss', async () => {
    mockMiss(); // primary wallet miss
    mockMiss(); // custody miss
    mockMiss(); // verified_addresses miss
    mockHit({ id: 'user-1', primary_wallet: '0xwallet' }); // users table hit
    const result = await checkAllowlist(undefined, '0xwallet');
    expect(result.allowed).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('returns { allowed: false } when wallet matches nothing', async () => {
    mockMiss(); // primary wallet miss
    mockMiss(); // custody miss
    mockMiss(); // verified_addresses miss
    mockMiss(); // users table miss
    const result = await checkAllowlist(undefined, '0xunknown');
    expect(result).toEqual({ allowed: false });
  });
});

// ---------------------------------------------------------------------------
// Combined FID + wallet
// ---------------------------------------------------------------------------
describe('combined FID + wallet', () => {
  it('FID match short-circuits all wallet checks', async () => {
    mockHit(); // FID hit
    const result = await checkAllowlist(42, '0xwallet');
    expect(result.allowed).toBe(true);
    // Only the allowlist FID query should have run
    expect(chain.eq).not.toHaveBeenCalledWith('wallet_address', expect.anything());
  });
});

// ---------------------------------------------------------------------------
// A database error is UNKNOWN, never "not a member"
// supabase-js resolves { data: null, error } instead of throwing; reading that
// as a miss would downgrade a member to a visitor when the front door is open.
// ---------------------------------------------------------------------------
describe('database errors', () => {
  const DB_ERROR = { data: null, error: { message: 'connection refused', code: '08006' } };

  it('throws AllowlistLookupError when the FID lookup returns an error result', async () => {
    chain.maybeSingle.mockResolvedValueOnce(DB_ERROR);
    await expect(checkAllowlist(12345)).rejects.toBeInstanceOf(AllowlistLookupError);
  });

  it('throws when an error comes later, after earlier lookups missed', async () => {
    mockMiss(); // allowlist FID: completed, no row
    chain.maybeSingle.mockResolvedValueOnce(DB_ERROR); // users fallback errors
    await expect(checkAllowlist(12345)).rejects.toBeInstanceOf(AllowlistLookupError);
  });

  it('throws on an error in the wallet path', async () => {
    chain.maybeSingle.mockResolvedValueOnce(DB_ERROR);
    await expect(checkAllowlist(undefined, '0xABC')).rejects.toBeInstanceOf(AllowlistLookupError);
  });

  it('still resolves { allowed: false } when every lookup completed and missed', async () => {
    for (let i = 0; i < 6; i++) mockMiss();
    await expect(checkAllowlist(12345, '0xabc')).resolves.toEqual({ allowed: false });
  });
});
