import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/env', () => ({
  ENV: { NEYNAR_API_KEY: 'test-key' },
}));

// Mock global fetch for Neynar calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { GET } from '@/app/api/members/route';

function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

const baseMember = {
  id: 'm1',
  fid: 100,
  username: 'alice',
  real_name: 'Alice',
  ign: 'alice_ign',
  display_name: 'Alice D',
  pfp_url: 'https://example.com/pfp.png',
  wallet_address: '0xAAA',
  custody_address: '0xBBB',
  verified_addresses: ['0xCCC'],
};

describe('GET /api/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns members when authenticated (no enrichment needed)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 100, isAdmin: false });

    // First call: allowlist query
    const allowlistChain = chainMock({ data: [baseMember], error: null });
    // Second call: users table for login/xmtp data
    const usersChain = chainMock({
      data: [{ fid: 100, last_login_at: '2026-01-01T00:00:00Z', xmtp_address: '0xXMTP' }],
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? allowlistChain : usersChain;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toHaveLength(1);
    expect(body.members[0].username).toBe('alice');
    expect(body.members[0].displayName).toBe('Alice D');
    expect(body.currentFid).toBe(100);
    // XMTP address should be first in addresses list
    expect(body.members[0].storedXmtpAddress).toBe('0xXMTP');
    expect(body.members[0].lastLoginAt).toBe('2026-01-01T00:00:00Z');
  });

  it('returns 500 when supabase query fails', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 100, isAdmin: false });

    const errorChain = chainMock({ data: null, error: { message: 'db error' } });
    mockFrom.mockReturnValue(errorChain);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load members');
  });

  it('handles empty member list', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 100, isAdmin: false });

    const allowlistChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(allowlistChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toHaveLength(0);
  });

  it('deduplicates addresses case-insensitively', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 100, isAdmin: false });

    const memberWithDupes = {
      ...baseMember,
      wallet_address: '0xaaa', // lowercase duplicate of custody
      custody_address: '0xAAA',
      verified_addresses: ['0xAaA'],
    };

    const allowlistChain = chainMock({ data: [memberWithDupes], error: null });
    const usersChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? allowlistChain : usersChain;
    });

    const res = await GET();
    const body = await res.json();
    // All three are the same address (case-insensitive), should dedupe to 1
    expect(body.members[0].addresses).toHaveLength(1);
  });
});
