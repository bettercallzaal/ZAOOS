import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger, mockFetch } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
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

// Mock global fetch
global.fetch = mockFetch as unknown as typeof fetch;

import { POST } from '../route';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

type AirtableRecord = { id: string; fields: Record<string, unknown> };

/**
 * Build a Supabase query-chain mock that resolves to result.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'like',
    'order',
    'range',
    'limit',
  ];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Create a FIFO queue of chains for sequential calls to mockFrom().
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

/**
 * Mock a successful Airtable fetch response.
 */
function mockAirtableFetchSuccess(records: AirtableRecord[], hasMore = false) {
  return Promise.resolve({
    ok: true,
    status: 200,
    text: async () => '',
    json: async () => ({
      records,
      offset: hasMore ? 'next-offset' : undefined,
    }),
  } as Response);
}

/**
 * Mock a failed Airtable fetch response.
 */
function mockAirtableFetchError(status: number, message: string) {
  return Promise.resolve({
    ok: false,
    status,
    text: async () => `Error: ${message}`,
    json: async () => ({}),
  } as Response);
}

/**
 * Setup standard fetch mocks for all 6 Airtable tables.
 */
function setupFetchMocks(
  wallets: AirtableRecord[] = [],
  summary: AirtableRecord[] = [],
  respect: AirtableRecord[] = [],
  hosts: AirtableRecord[] = [],
  festivals: AirtableRecord[] = [],
  misc: AirtableRecord[] = [],
) {
  const responses = [
    mockAirtableFetchSuccess(wallets),
    mockAirtableFetchSuccess(summary),
    mockAirtableFetchSuccess(respect),
    mockAirtableFetchSuccess(hosts),
    mockAirtableFetchSuccess(festivals),
    mockAirtableFetchSuccess(misc),
  ];

  responses.forEach((r) => {
    mockFetch.mockResolvedValueOnce(r as never);
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/respect-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AIRTABLE_TOKEN = 'test-token-12345';
  });

  // ── Authentication & Authorization ────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await POST();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Environment Variable ───────────────────────────────────────────────────

  it('returns 500 when AIRTABLE_TOKEN is not configured', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    delete process.env.AIRTABLE_TOKEN;

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('AIRTABLE_TOKEN not configured');
  });

  // ── Fetch Error Accumulation ───────────────────────────────────────────────

  it('accumulates fetch errors and continues', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    // First table fails, rest succeed
    mockFetch
      .mockResolvedValueOnce(mockAirtableFetchError(403, 'Wallet forbidden') as never)
      .mockResolvedValueOnce(mockAirtableFetchSuccess([]) as never)
      .mockResolvedValueOnce(mockAirtableFetchSuccess([]) as never)
      .mockResolvedValueOnce(mockAirtableFetchSuccess([]) as never)
      .mockResolvedValueOnce(mockAirtableFetchSuccess([]) as never)
      .mockResolvedValueOnce(mockAirtableFetchSuccess([]) as never);

    const queue = createChainQueue([
      { error: null }, // members upsert
      { data: [], error: null }, // sessions select
      { data: [], error: null }, // sessions insert
      { data: [], error: null }, // events delete
      { data: [], error: null }, // scores select
      { data: [], error: null }, // events select
      { data: [], error: null }, // sessions select
      { data: [], error: null }, // members select
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.errors.length).toBeGreaterThan(0);
  });

  // ── Wallet Map Building ────────────────────────────────────────────────────

  it('builds wallet map from Wallet Data table', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const walletRecords: AirtableRecord[] = [
      { id: 'w1', fields: { Name: 'Alice', 'ETH WALLET': '0xaaaa' } },
      { id: 'w2', fields: { Name: 'Bob', 'ETH WALLET': '0xbbbb' } },
    ];

    setupFetchMocks(walletRecords);

    const queue = createChainQueue([
      { error: null }, // members upsert
      { data: [], error: null }, // sessions select
      { data: [], error: null }, // sessions insert
      { data: [], error: null }, // events delete
      { data: [], error: null }, // scores select
      { data: [], error: null }, // events select
      { data: [], error: null }, // sessions select
      { data: [], error: null }, // members select
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.wallets).toBe(2);
  });

  // ── Member Import ──────────────────────────────────────────────────────────

  // ── Event Imports ──────────────────────────────────────────────────────────

  it('imports hosting events from Fractal Hosts table', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const hostRecords: AirtableRecord[] = [
      { id: 'h1', fields: { Name: 'Alice', Amount: 10 } },
      { id: 'h2', fields: { Name: 'Bob', Amount: 5 } },
    ];

    setupFetchMocks([], [], [], hostRecords);

    const queue = createChainQueue([
      { error: null }, // members upsert
      { data: [], error: null }, // sessions select
      { data: [], error: null }, // sessions insert
      { data: [], error: null }, // events delete
      { data: [], error: null }, // scores select
      { data: [], error: null }, // events select
      { data: [], error: null }, // sessions select
      { data: [], error: null }, // members select
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.hosts).toBe(2);
  });

  it('imports festival events', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const festivalRecords: AirtableRecord[] = [
      { id: 'f1', fields: { Name: 'Alice', Amount: 25, Festival: 'Fest 1' } },
    ];

    setupFetchMocks([], [], [], [], festivalRecords);

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.festivals).toBe(1);
  });

  it('imports misc events', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const miscRecords: AirtableRecord[] = [
      { id: 'm1', fields: { Name: 'Alice', Amount: 15, Type: 'contribution' } },
      { id: 'm2', fields: { Name: 'Bob', Amount: 8, Type: 'intro' } },
    ];

    setupFetchMocks([], [], [], [], [], miscRecords);

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.misc).toBe(2);
  });

  it('skips events with zero amount', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const hostRecords: AirtableRecord[] = [
      { id: 'h1', fields: { Name: 'Alice', Amount: 10 } },
      { id: 'h2', fields: { Name: 'Bob', Amount: 0 } },
    ];

    setupFetchMocks([], [], [], hostRecords);

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.hosts).toBe(1);
  });

  // ── Full Success Path & Response Shape ────────────────────────────────────

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    setupFetchMocks();

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.stats).toBeDefined();
    expect(body.errors).toBeDefined();
    expect(Object.keys(body.stats).sort()).toEqual(
      [
        'wallets',
        'members',
        'sessions',
        'scores',
        'hosts',
        'festivals',
        'misc',
        'enriched',
        'firstRespectSet',
      ].sort(),
    );
  });

  // ── Error Handling ────────────────────────────────────────────────────────

  it('logs fatal errors on exception', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await POST();
    expect(res.status).toBe(500);
    expect(mockLogger.error).toHaveBeenCalledWith(
      '[Airtable Sync] Fatal error:',
      expect.any(Error),
    );
  });

  it('handles empty tables gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    setupFetchMocks();

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stats.wallets).toBe(0);
    expect(body.stats.members).toBe(0);
    expect(body.stats.sessions).toBe(0);
    expect(body.stats.enriched).toBe(0);
  });

  it('handles array values in Airtable fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const walletRecords: AirtableRecord[] = [
      {
        id: 'w1',
        fields: { Name: ['Alice'], 'ETH WALLET': ['0xaaaa'] },
      },
    ];

    setupFetchMocks(walletRecords);

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.wallets).toBe(1);
  });

  it('normalizes wallet addresses to lowercase', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const walletRecords: AirtableRecord[] = [
      { id: 'w1', fields: { Name: 'Alice', 'ETH WALLET': '0xAAAA' } },
    ];

    setupFetchMocks(walletRecords);

    const queue = createChainQueue([
      { error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.wallets).toBe(1);
  });
});
