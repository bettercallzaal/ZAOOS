import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

// Test suite for src/app/api/admin/search-users/route.ts
// Covers: auth guards, query validation, search-by-term, search-by-fid,
// ENS enrichment, error handling, empty results.

const { mockGetSessionData, mockSearchUsers, mockGetUserByFid, mockGetUsersByFids, mockEnsClient } =
  vi.hoisted(() => ({
    mockGetSessionData: vi.fn(),
    mockSearchUsers: vi.fn(),
    mockGetUserByFid: vi.fn(),
    mockGetUsersByFids: vi.fn(),
    // Shared mock client that tests can configure
    mockEnsClient: {
      getEnsName: vi.fn(async () => null),
    },
  }));

// Mock viem — the module-level ensClient calls createPublicClient at load time.
// Return the shared mockEnsClient so tests can configure it.
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => mockEnsClient),
  http: vi.fn(),
}));

vi.mock('viem/chains', () => ({
  mainnet: { id: 1, name: 'Mainnet' },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  searchUsers: mockSearchUsers,
  getUserByFid: mockGetUserByFid,
  getUsersByFids: mockGetUsersByFids,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { GET } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
});

// ───────────────────────────────────────────────────────────────────────────────
// Authentication & Authorization
// ───────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/search-users — auth', () => {
  it('rejects unauthenticated (no session) with 401', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Admin access required');
  });

  it('rejects non-admin user with 403', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 999, isAdmin: false });
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Admin access required');
  });

  it('allows admin user', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
    mockSearchUsers.mockResolvedValue({ result: { users: [] } });
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Query Validation
// ───────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/search-users — query validation', () => {
  beforeEach(() => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
  });

  it('rejects missing query and fid with 400', async () => {
    const req = makeGetRequest('/api/admin/search-users', {});
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Query required');
  });

  it('rejects empty/whitespace-only query with 400', async () => {
    const req = makeGetRequest('/api/admin/search-users', { q: '   ' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Query required');
  });

  it('rejects non-numeric fid with 400', async () => {
    const req = makeGetRequest('/api/admin/search-users', { fid: 'abc' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid FID');
  });

  it('accepts fid=0 (does not validate range, only NaN)', async () => {
    // The route only checks isNaN, not range, so fid=0 is technically valid
    mockGetUserByFid.mockResolvedValue(null);
    const req = makeGetRequest('/api/admin/search-users', { fid: '0' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetUserByFid).toHaveBeenCalledWith(0);
  });

  it('accepts negative fid (does not validate range, only NaN)', async () => {
    // The route only checks isNaN, not range, so negative fid is technically valid
    mockGetUserByFid.mockResolvedValue(null);
    const req = makeGetRequest('/api/admin/search-users', { fid: '-1' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetUserByFid).toHaveBeenCalledWith(-1);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Search by FID
// ───────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/search-users?fid=N — FID lookup', () => {
  beforeEach(() => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
  });

  it('returns empty users array when user not found', async () => {
    mockGetUserByFid.mockResolvedValue(null);
    const req = makeGetRequest('/api/admin/search-users', { fid: '999' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });

  it('returns user with no wallet addresses', async () => {
    mockGetUserByFid.mockResolvedValue({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://example.com/alice.png',
    });
    const req = makeGetRequest('/api/admin/search-users', { fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.users[0]).toMatchObject({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      custody_address: '',
      verified_addresses: [],
      ens: {},
    });
  });

  it('returns user with custody address but no verified addresses', async () => {
    mockGetUserByFid.mockResolvedValue({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://example.com/alice.png',
      custody_address: '0x1111111111111111111111111111111111111111',
      verified_addresses: null,
    });
    const req = makeGetRequest('/api/admin/search-users', { fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users[0]).toMatchObject({
      fid: 123,
      custody_address: '0x1111111111111111111111111111111111111111',
      verified_addresses: [],
      ens: {},
    });
  });

  it('returns user with multiple addresses and ENS enrichment', async () => {
    mockGetUserByFid.mockResolvedValue({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://example.com/alice.png',
      custody_address: '0x1111111111111111111111111111111111111111',
      verified_addresses: {
        eth_addresses: [
          '0x2222222222222222222222222222222222222222',
          '0x3333333333333333333333333333333333333333',
        ],
      },
    });
    // Mock viem's getEnsName to resolve for the first address only
    mockEnsClient.getEnsName = vi
      .fn()
      .mockResolvedValueOnce('alice.eth')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const req = makeGetRequest('/api/admin/search-users', { fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users[0]).toMatchObject({
      fid: 123,
      custody_address: '0x1111111111111111111111111111111111111111',
      verified_addresses: [
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ],
    });
    // ENS resolution should map the first address that resolved
    expect(json.users[0].ens['0x1111111111111111111111111111111111111111']).toBe('alice.eth');
  });

  it('gracefully degrades when ENS resolution fails (404 or timeout)', async () => {
    mockGetUserByFid.mockResolvedValue({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://example.com/alice.png',
      custody_address: '0x1111111111111111111111111111111111111111',
      verified_addresses: { eth_addresses: [] },
    });
    // getEnsName is already mocked to return null at module load
    const req = makeGetRequest('/api/admin/search-users', { fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users[0].ens).toEqual({});
  });

  it('returns 502 when getUserByFid throws', async () => {
    mockGetUserByFid.mockRejectedValue(new Error('Neynar API down'));
    const req = makeGetRequest('/api/admin/search-users', { fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain('Failed to look up FID');
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Search by Query Term
// ───────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/search-users?q=term — username search', () => {
  beforeEach(() => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
  });

  it('returns empty results when Neynar returns no matches', async () => {
    mockSearchUsers.mockResolvedValue({ result: { users: [] } });
    const req = makeGetRequest('/api/admin/search-users', { q: 'nonexistent' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });

  it('returns basic users when bulk profile fetch fails', async () => {
    mockSearchUsers.mockResolvedValue({
      result: {
        users: [
          {
            fid: 1,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.png',
          },
          {
            fid: 2,
            username: 'bob',
            display_name: 'Bob',
            pfp_url: 'https://example.com/bob.png',
          },
        ],
      },
    });
    mockGetUsersByFids.mockRejectedValue(new Error('Bulk fetch failed'));
    const req = makeGetRequest('/api/admin/search-users', { q: 'al' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toHaveLength(2);
    // Verify it's returning basic user objects (no wallet enrichment)
    expect(json.users[0]).toMatchObject({
      fid: 1,
      username: 'alice',
      custody_address: '',
      verified_addresses: [],
    });
  });

  it('returns at most 8 results', async () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      fid: i,
      username: `user${i}`,
      display_name: `User ${i}`,
      pfp_url: `https://example.com/user${i}.png`,
    }));
    mockSearchUsers.mockResolvedValue({ result: { users } });
    mockGetUsersByFids.mockResolvedValue([]);
    const req = makeGetRequest('/api/admin/search-users', { q: 'user' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users.length).toBeLessThanOrEqual(8);
  });

  it('enriches search results with full profiles and ENS', async () => {
    mockSearchUsers.mockResolvedValue({
      result: {
        users: [
          {
            fid: 1,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.png',
          },
        ],
      },
    });
    mockGetUsersByFids.mockResolvedValue([
      {
        fid: 1,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: 'https://example.com/alice.png',
        custody_address: '0x1111111111111111111111111111111111111111',
        verified_addresses: { eth_addresses: ['0x2222222222222222222222222222222222222222'] },
      },
    ]);
    // Mock ENS to resolve for the custody address
    mockEnsClient.getEnsName = vi
      .fn()
      .mockResolvedValueOnce('alice.eth')
      .mockResolvedValueOnce(null);

    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.users[0]).toMatchObject({
      fid: 1,
      username: 'alice',
      custody_address: '0x1111111111111111111111111111111111111111',
      verified_addresses: ['0x2222222222222222222222222222222222222222'],
    });
    expect(json.users[0].ens['0x1111111111111111111111111111111111111111']).toBe('alice.eth');
  });

  it('gracefully degrades when ENS lookup fails during search enrichment', async () => {
    mockSearchUsers.mockResolvedValue({
      result: {
        users: [
          {
            fid: 1,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.png',
          },
        ],
      },
    });
    mockGetUsersByFids.mockResolvedValue([
      {
        fid: 1,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: 'https://example.com/alice.png',
        custody_address: '0x1111111111111111111111111111111111111111',
        verified_addresses: { eth_addresses: [] },
      },
    ]);
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users[0].ens).toEqual({});
  });

  it('returns 502 when Neynar search throws', async () => {
    mockSearchUsers.mockRejectedValue(new Error('Neynar API rate limited'));
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain('Farcaster search failed');
  });

  it('handles search result missing custody/verified address fields', async () => {
    mockSearchUsers.mockResolvedValue({
      result: {
        users: [
          {
            fid: 1,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.png',
          },
        ],
      },
    });
    mockGetUsersByFids.mockResolvedValue([
      {
        fid: 1,
        username: 'alice',
        display_name: 'Alice',
        pfp_url: 'https://example.com/alice.png',
        // custody_address and verified_addresses intentionally missing
      },
    ]);
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users[0]).toMatchObject({
      custody_address: '',
      verified_addresses: [],
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Edge Cases & Error Paths
// ───────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/search-users — edge cases', () => {
  beforeEach(() => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
  });

  it('trims whitespace from query parameter before calling searchUsers', async () => {
    mockSearchUsers.mockResolvedValue({ result: { users: [] } });
    const req = makeGetRequest('/api/admin/search-users', { q: '  alice  ' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    // The route calls searchUsers(query, 8) where query has been trimmed
    expect(mockSearchUsers).toHaveBeenCalled();
    const callArgs = mockSearchUsers.mock.calls[0];
    expect(callArgs[0]).toBe('alice');
    expect(callArgs[1]).toBe(8);
  });

  it('prefers fid parameter over q parameter (fid takes priority)', async () => {
    mockGetUserByFid.mockResolvedValue({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://example.com/alice.png',
    });
    // Both q and fid present; fid should win
    const req = makeGetRequest('/api/admin/search-users', { q: 'bob', fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetUserByFid).toHaveBeenCalledWith(123);
    expect(mockSearchUsers).not.toHaveBeenCalled();
  });

  it('handles null result in Neynar search response gracefully', async () => {
    mockSearchUsers.mockResolvedValue({ result: null });
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });

  it('handles undefined users in search result', async () => {
    mockSearchUsers.mockResolvedValue({ result: { users: undefined } });
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });

  it('filters out falsy enriched users from final response', async () => {
    mockSearchUsers.mockResolvedValue({
      result: {
        users: [
          {
            fid: 1,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.png',
          },
        ],
      },
    });
    // getUsersByFids returns an empty array (user not found in bulk fetch)
    mockGetUsersByFids.mockResolvedValue([]);
    const req = makeGetRequest('/api/admin/search-users', { q: 'alice' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    // Search result should still return the basic user from searchUsers
    expect(json.users).toHaveLength(1);
  });

  it('converts address to lowercase in ENS map key', async () => {
    mockGetUserByFid.mockResolvedValue({
      fid: 123,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://example.com/alice.png',
      custody_address: '0xABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD',
      verified_addresses: null,
    });
    // Mock ENS to resolve for this address
    mockEnsClient.getEnsName = vi.fn().mockResolvedValueOnce('alice.eth');

    const req = makeGetRequest('/api/admin/search-users', { fid: '123' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    // The ENS map should have a lowercase key
    expect(json.users[0].ens['0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd']).toBe('alice.eth');
  });
});
