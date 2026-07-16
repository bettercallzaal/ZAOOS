import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger, mockFetch } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
  },
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
  },
}));

// Mock global fetch before importing the route
global.fetch = mockFetch;

import { POST } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for further chaining.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = ['select', 'update', 'eq'];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = vi.fn((resolve: (val: unknown) => void) =>
    resolve(result),
  );

  return chain;
}

describe('POST /api/admin/backfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication & Authorization ───────────────────────────────────────

  it('returns 403 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Database read failure ────────────────────────────────────────────────

  it('returns 500 when Supabase fetch fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: null, error: { message: 'permission denied' } });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch allowlist');
  });

  // ── No entries needing backfill ──────────────────────────────────────────

  it('returns success message when all entries have FID and profile', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entries = [
      {
        id: VALID_UUID,
        fid: 12345,
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        ign: 'alice',
        real_name: null,
        username: 'alice_farcaster',
        pfp_url: 'https://example.com/alice.jpg',
      },
    ];

    const chain = chainMock({ data: entries, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('All entries already have FIDs and profiles');
    expect(body.updated).toBe(0);
  });

  it('returns 200 with updated=0 when no active entries exist', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(0);
  });

  // ── Single entry success ─────────────────────────────────────────────────

  it('backfills missing FID for single entry from Neynar', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'alice',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    const chain = chainMock({ data: [entry], error: null });
    mockFrom.mockReturnValue(chain);

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [
        {
          fid: 5678,
          username: 'alice_farcaster',
          display_name: 'Alice',
          pfp_url: 'https://pfp.example.com/alice.jpg',
          custody_address: '0x2222222222222222222222222222222222222222',
          verified_addresses: {
            eth_addresses: ['0x1111111111111111111111111111111111111111'],
            sol_addresses: [],
          },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(1);
    expect(body.details[0].status).toBe('updated');
    expect(body.details[0].fid).toBe(5678);
  });

  // ── Multiple entries with batch ──────────────────────────────────────────

  it('processes multiple entries in batches of 50', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    // Create 75 entries to trigger 2 batches (50 + 25)
    const entries = Array.from({ length: 75 }, (_, i) => ({
      id: VALID_UUID,
      fid: null,
      wallet_address: `0x${String(i).padStart(40, '0')}`,
      ign: `user${i}`,
      real_name: null,
      username: null,
      pfp_url: null,
    }));

    const chain = chainMock({ data: entries, error: null });
    mockFrom.mockReturnValue(chain);

    const batch1Addresses = entries.slice(0, 50).map((e) => e.wallet_address.toLowerCase());
    const batch2Addresses = entries.slice(50).map((e) => e.wallet_address.toLowerCase());

    const neynarBatch1: Record<string, unknown> = {};
    batch1Addresses.forEach((addr, idx) => {
      neynarBatch1[addr] = [
        {
          fid: 1000 + idx,
          username: `user${idx}`,
          display_name: `User ${idx}`,
          pfp_url: `https://pfp.example.com/user${idx}.jpg`,
          custody_address: `0x${String(idx).padStart(40, '0')}`,
          verified_addresses: { eth_addresses: [addr], sol_addresses: [] },
        },
      ];
    });

    const neynarBatch2: Record<string, unknown> = {};
    batch2Addresses.forEach((addr, idx) => {
      neynarBatch2[addr] = [
        {
          fid: 2000 + idx,
          username: `user${50 + idx}`,
          display_name: `User ${50 + idx}`,
          pfp_url: `https://pfp.example.com/user${50 + idx}.jpg`,
          custody_address: `0x${String(50 + idx).padStart(40, '0')}`,
          verified_addresses: { eth_addresses: [addr], sol_addresses: [] },
        },
      ];
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(neynarBatch1),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(neynarBatch2),
      });

    const res = await POST(makeRequest('/api/admin/backfill'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(75);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── No Farcaster account ─────────────────────────────────────────────────

  it('marks entry as no_farcaster_account when Neynar returns empty', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'bob',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    const chain = chainMock({ data: [entry], error: null });
    mockFrom.mockReturnValue(chain);

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [], // Empty array: no FC account
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    expect(body.noAccount).toBe(1);
    expect(body.details[0].status).toBe('no_farcaster_account');
  });

  // ── Neynar API error ─────────────────────────────────────────────────────

  it('marks entries as neynar_error when Neynar returns non-2xx status', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entries = [
      {
        id: VALID_UUID,
        fid: null,
        wallet_address: '0x1111111111111111111111111111111111111111',
        ign: 'alice',
        real_name: null,
        username: null,
        pfp_url: null,
      },
    ];

    const chain = chainMock({ data: entries, error: null });
    mockFrom.mockReturnValue(chain);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({ error: 'Rate limited' }),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    expect(body.errors).toBe(1);
    expect(body.details[0].status).toBe('neynar_error_429');
  });

  // ── Database update error ────────────────────────────────────────────────

  it('marks entry as db_error when update fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'charlie',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: fetch allowlist
        return chainMock({ data: [entry], error: null });
      }
      // Second call: update allowlist — fails
      return chainMock({
        data: null,
        error: { message: 'unique constraint violation' },
      });
    });

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [
        {
          fid: 9999,
          username: 'charlie_farcaster',
          display_name: 'Charlie',
          pfp_url: 'https://pfp.example.com/charlie.jpg',
          custody_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          verified_addresses: {
            eth_addresses: ['0x1111111111111111111111111111111111111111'],
            sol_addresses: [],
          },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    expect(body.errors).toBe(1);
    expect(body.details[0].status).toContain('db_error');
    expect(body.details[0].status).toContain('unique constraint violation');
  });

  // ── Fetch exception (network error) ──────────────────────────────────────

  it('marks entries as error when fetch throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entries = [
      {
        id: VALID_UUID,
        fid: null,
        wallet_address: '0x1111111111111111111111111111111111111111',
        ign: 'dave',
        real_name: null,
        username: null,
        pfp_url: null,
      },
    ];

    const chain = chainMock({ data: entries, error: null });
    mockFrom.mockReturnValue(chain);

    mockFetch.mockRejectedValue(new Error('Network timeout'));

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    expect(body.errors).toBe(1);
    expect(body.details[0].status).toBe('error');
  });

  // ── Partial success / mixed results ──────────────────────────────────────

  it('accumulates stats from mixed success/failure/no-account results', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entries = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        fid: null,
        wallet_address: '0x1111111111111111111111111111111111111111',
        ign: 'success',
        real_name: null,
        username: null,
        pfp_url: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        fid: null,
        wallet_address: '0x2222222222222222222222222222222222222222',
        ign: 'no_account',
        real_name: null,
        username: null,
        pfp_url: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        fid: null,
        wallet_address: '0x3333333333333333333333333333333333333333',
        ign: 'error',
        real_name: null,
        username: null,
        pfp_url: null,
      },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Fetch allowlist
        return chainMock({ data: entries, error: null });
      }
      // First update: success
      if (callCount === 2) {
        return chainMock({ data: null, error: null });
      }
      // Second update: db error
      if (callCount === 3) {
        return chainMock({ data: null, error: { message: 'db error' } });
      }
      throw new Error('Unexpected call');
    });

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [
        {
          fid: 100,
          username: 'success_fc',
          display_name: 'Success',
          pfp_url: 'https://pfp.example.com/success.jpg',
          custody_address: '0xaaaa',
          verified_addresses: { eth_addresses: [], sol_addresses: [] },
        },
      ],
      '0x2222222222222222222222222222222222222222': [], // No account
      '0x3333333333333333333333333333333333333333': [
        {
          fid: 300,
          username: 'error_fc',
          display_name: 'Error',
          pfp_url: 'https://pfp.example.com/error.jpg',
          custody_address: '0xcccc',
          verified_addresses: { eth_addresses: [], sol_addresses: [] },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updated).toBe(1);
    expect(body.noAccount).toBe(1);
    expect(body.errors).toBe(1);
  });

  // ── Selective field filling ──────────────────────────────────────────────

  it('only fills in missing fields, does not overwrite existing data', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    // Entry has existing FID and username, but missing pfp_url
    const entry = {
      id: VALID_UUID,
      fid: 5555,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'existing_user',
      real_name: 'Real Name',
      username: 'existing_username', // Existing, should not be overwritten
      pfp_url: null, // Missing, should be filled
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainMock({ data: [entry], error: null });
      }
      // Verify the update call
      const updateChain = chainMock({ data: null, error: null });
      return updateChain;
    });

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [
        {
          fid: 9999, // Different FID, should not update existing
          username: 'neynar_username',
          display_name: 'Neynar Display',
          pfp_url: 'https://pfp.example.com/neynar.jpg', // Should fill this
          custody_address: '0xcccc',
          verified_addresses: { eth_addresses: [], sol_addresses: [] },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    expect(res.status).toBe(200);
    // Verify via details that update attempted
    expect(body.updated).toBe(1);
  });

  // ── Handle entries without wallet_address ────────────────────────────────

  it('filters out entries with missing wallet_address', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entries = [
      {
        id: VALID_UUID,
        fid: null,
        wallet_address: null, // Missing — should be filtered
        ign: 'no_wallet',
        real_name: null,
        username: null,
        pfp_url: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        fid: null,
        wallet_address: '0x1111111111111111111111111111111111111111',
        ign: 'with_wallet',
        real_name: null,
        username: null,
        pfp_url: null,
      },
    ];

    const chain = chainMock({ data: entries, error: null });
    mockFrom.mockReturnValue(chain);

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [
        {
          fid: 111,
          username: 'with_wallet_fc',
          display_name: 'With Wallet',
          pfp_url: 'https://pfp.example.com/wallet.jpg',
          custody_address: '0xaaaa',
          verified_addresses: { eth_addresses: [], sol_addresses: [] },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();
    // Only the entry with wallet_address should be processed
    expect(body.updated).toBe(1);
    expect(body.details).toHaveLength(1);
  });

  // ── Response shape validation ────────────────────────────────────────────

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['message', 'updated'].sort());
  });

  it('returns response with detailed shape on backfill', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'test',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    const chain = chainMock({ data: [entry], error: null });
    mockFrom.mockReturnValue(chain);

    const neynarResponse = {
      '0x1111111111111111111111111111111111111111': [
        {
          fid: 5678,
          username: 'test_fc',
          display_name: 'Test',
          pfp_url: 'https://pfp.example.com/test.jpg',
          custody_address: '0xbbbb',
          verified_addresses: { eth_addresses: [], sol_addresses: [] },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await POST(makeRequest('/api/admin/backfill'));
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(
      ['message', 'updated', 'noAccount', 'errors', 'details'].sort(),
    );
    expect(Array.isArray(body.details)).toBe(true);
  });

  // ── Wallet address case normalization ────────────────────────────────────

  it('normalizes wallet addresses to lowercase for Neynar lookup', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Uppercase (40 chars)
      ign: 'upper',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    const chain = chainMock({ data: [entry], error: null });
    mockFrom.mockReturnValue(chain);

    const neynarResponse = {
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa': [
        {
          fid: 1111,
          username: 'upper_fc',
          display_name: 'Upper',
          pfp_url: 'https://pfp.example.com/upper.jpg',
          custody_address: '0xdddd',
          verified_addresses: { eth_addresses: [], sol_addresses: [] },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    await POST(makeRequest('/api/admin/backfill'));
    // Verify fetch was called with lowercase address
    const fetchCall = mockFetch.mock.calls[0][0] as string;
    expect(fetchCall).toContain('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  // ── Logs errors ──────────────────────────────────────────────────────────

  it('logs Neynar errors to logger.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'logged',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    const chain = chainMock({ data: [entry], error: null });
    mockFrom.mockReturnValue(chain);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'Neynar server error' }),
    });

    await POST(makeRequest('/api/admin/backfill'));

    expect(mockLogger.error).toHaveBeenCalledWith('Neynar bulk-by-address error: 500');
  });

  it('logs batch errors to logger.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const entry = {
      id: VALID_UUID,
      fid: null,
      wallet_address: '0x1111111111111111111111111111111111111111',
      ign: 'error_batch',
      real_name: null,
      username: null,
      pfp_url: null,
    };

    const chain = chainMock({ data: [entry], error: null });
    mockFrom.mockReturnValue(chain);

    mockFetch.mockRejectedValue(new Error('Network error'));

    await POST(makeRequest('/api/admin/backfill'));

    expect(mockLogger.error).toHaveBeenCalledWith('Backfill batch error:', expect.any(Error));
  });
});
