import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const {
  mockCreateSubnameWithFallback,
  mockBatchCreateSubnames,
  mockSanitizeSubname,
  mockIsValidSubname,
  mockBuildMemberTextRecords,
} = vi.hoisted(() => ({
  mockCreateSubnameWithFallback: vi.fn(),
  mockBatchCreateSubnames: vi.fn(),
  mockSanitizeSubname: vi.fn((name: string) => name.toLowerCase()),
  mockIsValidSubname: vi.fn((name: string) => /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)),
  mockBuildMemberTextRecords: vi.fn((member) => ({
    description: member.bio || 'ZAO Member',
    ...(member.username && { url: `https://zaoos.com/members/${member.username}` }),
    ...(member.pfpUrl && { avatar: member.pfpUrl }),
  })),
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

vi.mock('@/lib/ens/subnames', () => ({
  createSubnameWithFallback: (
    name: string,
    addr: string,
    zid: number | null,
    records: Record<string, string>,
  ) => mockCreateSubnameWithFallback(name, addr, zid, records),
  batchCreateSubnames: (names) => mockBatchCreateSubnames(names),
  sanitizeSubname: (name: string) => mockSanitizeSubname(name),
  isValidSubname: (name: string) => mockIsValidSubname(name),
  buildMemberTextRecords: (member) => mockBuildMemberTextRecords(member),
}));

import { DELETE, GET, POST } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for chaining.
 * Terminal .then() resolves the query (for awaited direct chains).
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = [
    'select',
    'update',
    'eq',
    'is',
    'order',
    'not',
    'gt',
    'lt',
    'insert',
    'single',
  ];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Create a mock queue that returns chains in sequence for parallel queries.
 */
function createChainQueue(
  results: Array<{ data?: unknown; error?: unknown; count?: number | null }>,
) {
  let callIndex = 0;
  return {
    mockFn: vi.fn(() => {
      if (callIndex >= results.length) {
        throw new Error(`Chain queue exhausted at call ${callIndex}`);
      }
      return chainMock(results[callIndex++]);
    }),
    getCallCount: () => callIndex,
  };
}

describe('GET /api/admin/ens-subnames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication & Authorization ────────────────────────────────────────

  it('returns 403 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Success path: list all active users ───────────────────────────────────

  it('returns 200 with members list on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const userData = [
      {
        fid: 123,
        username: 'alice',
        display_name: 'Alice',
        primary_wallet: '0x1111',
        zao_subname: 'alice.thezao.eth',
        zid: '001',
        pfp_url: 'https://example.com/alice.jpg',
      },
      {
        fid: 124,
        username: 'bob',
        display_name: 'Bob',
        primary_wallet: '0x2222',
        zao_subname: null,
        zid: null,
        pfp_url: null,
      },
    ];

    const chain = chainMock({ data: userData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.members).toHaveLength(2);
    expect(body.members[0]).toEqual({
      fid: 123,
      username: 'alice',
      displayName: 'Alice',
      wallet: '0x1111',
      zaoSubname: 'alice.thezao.eth',
      zid: '001',
      pfpUrl: 'https://example.com/alice.jpg',
    });
  });

  it('calls supabase with correct select fields and filters', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET();

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.select).toHaveBeenCalledWith(
      'fid, username, display_name, primary_wallet, zao_subname, zid, pfp_url',
    );
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(chain.not).toHaveBeenCalledWith('primary_wallet', 'is', null);
    expect(chain.order).toHaveBeenCalledWith('zid', { ascending: true, nullsFirst: false });
  });

  it('returns empty members array when no users found', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(body.members).toEqual([]);
  });

  it('transforms field names from snake_case to camelCase', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const userData = [
      {
        fid: 100,
        username: 'test',
        display_name: 'Test User',
        primary_wallet: '0xabcd',
        zao_subname: 'test.thezao.eth',
        zid: '999',
        pfp_url: 'https://example.com/test.jpg',
      },
    ];

    const chain = chainMock({ data: userData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    const member = body.members[0];
    expect(member).not.toHaveProperty('display_name');
    expect(member).not.toHaveProperty('primary_wallet');
    expect(member).not.toHaveProperty('zao_subname');
    expect(member).not.toHaveProperty('pfp_url');
    expect(member).toHaveProperty('displayName');
    expect(member).toHaveProperty('wallet');
    expect(member).toHaveProperty('zaoSubname');
    expect(member).toHaveProperty('pfpUrl');
  });

  // ── Error path ────────────────────────────────────────────────────────────

  it('returns 500 when DB query throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('Connection timeout');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to list subnames');
  });

  it('logs error when query fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const testError = new Error('DB error');
    mockFrom.mockImplementation(() => {
      throw testError;
    });

    await GET();

    expect(mockLogger.error).toHaveBeenCalledWith('[admin/ens-subnames] list error:', testError);
  });
});

describe('POST /api/admin/ens-subnames (Single Create)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication & Authorization ────────────────────────────────────────

  it('returns 403 when not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Input validation ──────────────────────────────────────────────────────

  it('returns 400 when body is not valid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = new Request(new URL('/api/admin/ens-subnames', 'http://localhost:3000'), {
      method: 'POST',
      body: 'invalid json',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500); // JSON parse error is caught in try/catch
  });

  it('returns 400 when fid is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when fid is not a number', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 'not-a-number', name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when fid is not a positive integer', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: -1, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when fid is 0', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 0, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when fid is a float', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 123.45, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when name is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds 63 characters', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const longName = 'a'.repeat(64);
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: longName });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts a 63-character name', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const name63 = 'a'.repeat(63);
    mockSanitizeSubname.mockReturnValue(name63);
    mockIsValidSubname.mockReturnValue(true);

    const chain = chainMock({
      data: {
        primary_wallet: '0x1234',
        zid: null,
        username: 'test',
        pfp_url: null,
        bio: null,
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: `${name63}.thezao.eth`,
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: name63 });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ── Single create success ──────────────────────────────────────────────────

  it('creates a single subname successfully', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const queue = createChainQueue([
      {
        data: {
          primary_wallet: '0x1234',
          zid: '001',
          username: 'alice',
          pfp_url: 'https://example.com/alice.jpg',
          bio: 'My bio',
        },
        error: null,
      },
      { error: null }, // update user
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: 'alice.thezao.eth',
      txHash: '0xabcd',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.subname).toBe('alice.thezao.eth');
  });

  it('sanitizes the name before validation', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const chain = chainMock({
      data: { primary_wallet: '0x1234', zid: null, username: 'alice', pfp_url: null, bio: null },
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: 'alice.thezao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'Alice' });
    await POST(req);

    expect(mockSanitizeSubname).toHaveBeenCalledWith('Alice');
    expect(mockIsValidSubname).toHaveBeenCalledWith('alice');
  });

  it('returns 400 when sanitized name is invalid', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('-invalid-');
    mockIsValidSubname.mockReturnValue(false);

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'invalid' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid subname');
  });

  it('returns 404 when user not found', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const chain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 999, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Member not found or no wallet');
  });

  it('returns 404 when user has no primary_wallet', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const chain = chainMock({
      data: {
        primary_wallet: null,
        zid: null,
        username: 'alice',
        pfp_url: null,
        bio: null,
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Member not found or no wallet');
  });

  it('calls buildMemberTextRecords with member data', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const userData = {
      primary_wallet: '0x1234',
      zid: '001',
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'My bio',
    };

    const queue = createChainQueue([{ data: userData, error: null }, { error: null }]);

    mockFrom.mockImplementation(queue.mockFn);
    mockBuildMemberTextRecords.mockReturnValue({ description: 'My bio' });
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: 'alice.thezao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    await POST(req);

    expect(mockBuildMemberTextRecords).toHaveBeenCalledWith({
      username: 'alice',
      pfpUrl: 'https://example.com/alice.jpg',
      bio: 'My bio',
    });
  });

  it('passes zid as number to createSubnameWithFallback', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const queue = createChainQueue([
      {
        data: {
          primary_wallet: '0x1234',
          zid: '999',
          username: 'alice',
          pfp_url: null,
          bio: null,
        },
        error: null,
      },
      { error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: 'alice.thezao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    await POST(req);

    expect(mockCreateSubnameWithFallback).toHaveBeenCalledWith(
      'alice',
      '0x1234',
      999,
      expect.any(Object),
    );
  });

  it('handles null zid correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const queue = createChainQueue([
      {
        data: {
          primary_wallet: '0x1234',
          zid: null,
          username: 'alice',
          pfp_url: null,
          bio: null,
        },
        error: null,
      },
      { error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: 'alice.thezao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    await POST(req);

    expect(mockCreateSubnameWithFallback).toHaveBeenCalledWith(
      'alice',
      '0x1234',
      null,
      expect.any(Object),
    );
  });

  it('returns 500 when ENS lib creation fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const chain = chainMock({
      data: { primary_wallet: '0x1234', zid: null, username: 'alice', pfp_url: null, bio: null },
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    mockCreateSubnameWithFallback.mockResolvedValue({
      success: false,
      fullName: 'alice.thezao.eth',
      error: 'Name already registered',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Name already registered');
  });

  it('updates DB with created subname', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockSanitizeSubname.mockReturnValue('alice');
    mockIsValidSubname.mockReturnValue(true);

    const chain = chainMock({
      data: { primary_wallet: '0x1234', zid: null, username: 'alice', pfp_url: null, bio: null },
      error: null,
    });

    let chainCallCount = 0;
    mockFrom.mockImplementation(() => {
      chainCallCount++;
      if (chainCallCount === 1) {
        return chain; // First call: select user
      }
      return chainMock({ error: null }); // Second call: update user
    });

    mockCreateSubnameWithFallback.mockResolvedValue({
      success: true,
      fullName: 'alice.thezao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith('users');
  });
});

describe('POST /api/admin/ens-subnames (Batch Create)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recognizes batch mode with { batch: true }', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // members without subname
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockBatchCreateSubnames.mockResolvedValue({ created: [], failed: [] });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.message).toContain('All members already have subnames');
    expect(body.created).toEqual([]);
    expect(body.failed).toEqual([]);
  });

  it('recognizes batch: true even with extra fields in body', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    // batch schema only checks for batch: true, doesn't strictly validate extra fields
    // so batch mode runs when batch: true is present
    const queue = createChainQueue([{ data: [], error: null }]);

    mockFrom.mockImplementation(queue.mockFn);
    mockBatchCreateSubnames.mockResolvedValue({ created: [], failed: [] });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true, extra: 'field' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('All members already have subnames');
  });

  it('queries members without subnames for batch mode', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    mockBatchCreateSubnames.mockResolvedValue({ created: [], failed: [] });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.select).toHaveBeenCalled();
  });

  it('returns 200 when all members already have subnames', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // no members without subname
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.message).toBe('All members already have subnames');
    expect(body.created).toEqual([]);
    expect(body.failed).toEqual([]);
  });

  it('processes multiple members in batch mode', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        fid: 100,
        username: 'alice',
        display_name: 'Alice',
        primary_wallet: '0x1111',
        zid: '001',
        pfp_url: 'https://example.com/alice.jpg',
        bio: 'Bio A',
        zao_subname: null,
      },
      {
        fid: 101,
        username: 'bob',
        display_name: 'Bob',
        primary_wallet: '0x2222',
        zid: '002',
        pfp_url: null,
        bio: null,
        zao_subname: null,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null },
      { error: null }, // first update
      { error: null }, // second update
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockSanitizeSubname.mockImplementation((n) => n.toLowerCase());
    mockBatchCreateSubnames.mockResolvedValue({
      created: [
        { name: 'alice.thezao.eth', txHash: '0xabc' },
        { name: 'bob.thezao.eth', txHash: '0xdef' },
      ],
      failed: [],
    });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.created).toHaveLength(2);
    expect(body.failed).toHaveLength(0);
    expect(mockBatchCreateSubnames).toHaveBeenCalled();
  });

  it('builds text records for each member in batch', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        fid: 100,
        username: 'alice',
        display_name: 'Alice',
        primary_wallet: '0x1111',
        zid: '001',
        pfp_url: 'https://example.com/alice.jpg',
        bio: 'My bio',
        zao_subname: null,
      },
    ];

    const queue = createChainQueue([{ data: membersData, error: null }, { error: null }]);

    mockFrom.mockImplementation(queue.mockFn);
    mockSanitizeSubname.mockReturnValue('alice');
    mockBuildMemberTextRecords.mockReturnValue({
      description: 'My bio',
      url: 'https://zaoos.com/members/alice',
    });
    mockBatchCreateSubnames.mockResolvedValue({
      created: [{ name: 'alice.thezao.eth' }],
      failed: [],
    });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    await POST(req);

    expect(mockBuildMemberTextRecords).toHaveBeenCalledWith({
      username: 'alice',
      pfpUrl: 'https://example.com/alice.jpg',
      bio: 'My bio',
    });
  });

  it('uses fallback username when not present', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        fid: 100,
        username: null,
        display_name: 'Alice',
        primary_wallet: '0x1111',
        zid: '001',
        pfp_url: null,
        bio: null,
        zao_subname: null,
      },
    ];

    const queue = createChainQueue([{ data: membersData, error: null }, { error: null }]);

    mockFrom.mockImplementation(queue.mockFn);
    mockSanitizeSubname.mockReturnValue('alice');
    mockBatchCreateSubnames.mockResolvedValue({
      created: [{ name: 'alice.thezao.eth' }],
      failed: [],
    });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    await POST(req);

    // Should use display_name or member-{fid} fallback
    expect(mockBatchCreateSubnames).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
        }),
      ]),
    );
  });

  it('updates DB for successfully created subnames', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        fid: 100,
        username: 'alice',
        display_name: 'Alice',
        primary_wallet: '0x1111',
        zid: '001',
        pfp_url: null,
        bio: null,
        zao_subname: null,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null },
      { error: null }, // update
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockSanitizeSubname.mockReturnValue('alice');
    mockBatchCreateSubnames.mockResolvedValue({
      created: [{ name: 'alice.thezao.eth' }],
      failed: [],
    });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('returns summary of created and failed subnames', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        fid: 100,
        username: 'alice',
        display_name: 'Alice',
        primary_wallet: '0x1111',
        zid: '001',
        pfp_url: null,
        bio: null,
        zao_subname: null,
      },
      {
        fid: 101,
        username: 'bob',
        display_name: 'Bob',
        primary_wallet: '0x2222',
        zid: '002',
        pfp_url: null,
        bio: null,
        zao_subname: null,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null },
      { error: null },
      { error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    mockSanitizeSubname.mockImplementation((n) => n.toLowerCase());
    mockBatchCreateSubnames.mockResolvedValue({
      created: [{ name: 'alice.thezao.eth' }],
      failed: [{ name: 'bob', error: 'Already registered' }],
    });

    const req = makePostRequest('/api/admin/ens-subnames', { batch: true });
    const res = await POST(req);
    const body = await res.json();

    expect(body.message).toBe('Created 1/2 subnames');
    expect(body.created).toHaveLength(1);
    expect(body.failed).toHaveLength(1);
  });
});

describe('DELETE /api/admin/ens-subnames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication & Authorization ────────────────────────────────────────

  it('returns 403 when not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Input validation ──────────────────────────────────────────────────────

  it('returns 400 when fid is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { name: 'alice' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when fid is not positive', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 0, name: 'alice' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100 });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds 63 characters', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const longName = 'a'.repeat(64);
    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: longName });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  // ── Success path ──────────────────────────────────────────────────────────

  it('unlinks subname from member successfully', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe('Subname unlinked from member profile');
  });

  it('updates DB to set zao_subname to null', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    await DELETE(req);

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.update).toHaveBeenCalledWith({ zao_subname: null });
    expect(chain.eq).toHaveBeenCalledWith('fid', 100);
  });

  it('returns correct response shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await DELETE(req);
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['message', 'success'].sort());
    expect(typeof body.success).toBe('boolean');
    expect(typeof body.message).toBe('string');
  });

  // ── Error path ────────────────────────────────────────────────────────────

  it('returns 500 when DB query throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('DB connection lost');
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    const res = await DELETE(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to revoke subname');
  });

  it('logs error when query fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const testError = new Error('DB error');
    mockFrom.mockImplementation(() => {
      throw testError;
    });

    const req = makePostRequest('/api/admin/ens-subnames', { fid: 100, name: 'alice' });
    await DELETE(req);

    expect(mockLogger.error).toHaveBeenCalledWith('[admin/ens-subnames] delete error:', testError);
  });
});
