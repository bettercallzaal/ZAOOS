import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

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

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Build a Supabase query chain that supports select, order, and limit,
 * all returning the chain itself for fluent chaining. Awaiting the chain
 * resolves to the provided result. This matches the route's actual query shapes.
 */
function exportChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/admin/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
  });

  // ─────────────────────────────────────────────────────────────────────
  // Authentication & Authorization
  // ─────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Forbidden');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Input Validation (Zod)
  // ─────────────────────────────────────────────────────────────────────

  it('returns 400 when type is missing', async () => {
    const res = await GET(makeGetRequest('/api/admin/export'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when type is invalid', async () => {
    const res = await GET(makeGetRequest('/api/admin/export', { type: 'invalid' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when format is invalid', async () => {
    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members', format: 'xml' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('defaults format to csv when not provided', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Members Export (CSV & JSON)
  // ─────────────────────────────────────────────────────────────────────

  it('exports members as CSV with correct headers and format', async () => {
    const mockData = [
      {
        name: 'Alice',
        wallet_address: '0x1234',
        fid: 100,
        total_respect: 500,
        fractal_respect: 200,
        fractal_count: 5,
        onchain_og: true,
        onchain_zor: false,
        hosting_respect: 100,
        bonus_respect: 0,
        event_respect: 200,
        first_respect_at: '2026-01-01',
      },
      {
        name: 'Bob',
        wallet_address: '0x5678',
        fid: 101,
        total_respect: 300,
        fractal_respect: 150,
        fractal_count: 3,
        onchain_og: false,
        onchain_zor: true,
        hosting_respect: 50,
        bonus_respect: 100,
        event_respect: 0,
        first_respect_at: '2026-01-15',
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');

    const body = await res.text();
    const lines = body.split('\n');
    expect(lines.length).toBe(3); // header + 2 rows
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('wallet_address');
    expect(lines[0]).toContain('total_respect');
    expect(lines[1]).toContain('Alice');
    expect(lines[2]).toContain('Bob');
  });

  it('exports members as JSON when format=json', async () => {
    const mockData = [
      {
        name: 'Charlie',
        wallet_address: '0x9999',
        fid: 200,
        total_respect: 1000,
        fractal_respect: 500,
        fractal_count: 10,
        onchain_og: true,
        onchain_zor: true,
        hosting_respect: 300,
        bonus_respect: 200,
        event_respect: 0,
        first_respect_at: '2025-12-01',
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members', format: 'json' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual(mockData);
  });

  it('orders members export by total_respect descending', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(chain.order).toHaveBeenCalledWith('total_respect', { ascending: false });
  });

  it('exports empty members list as CSV (no rows, just header)', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe(''); // empty list yields empty string from buildCsv
  });

  it('exports null members data as empty array', async () => {
    const chain = exportChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members', format: 'json' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Respect Export (with nested sessions)
  // ─────────────────────────────────────────────────────────────────────

  it('exports respect scores with flattened session data as JSON', async () => {
    const mockData = [
      {
        member_name: 'Alice',
        wallet_address: '0x1111',
        rank: 1,
        score: 950,
        session_id: 'sess_1',
        fractal_sessions: {
          name: 'Fractal Q1',
          session_date: '2026-01-15',
        },
      },
      {
        member_name: 'Bob',
        wallet_address: '0x2222',
        rank: 2,
        score: 850,
        session_id: 'sess_2',
        fractal_sessions: {
          name: 'Fractal Q1',
          session_date: '2026-01-15',
        },
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'respect', format: 'json' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body[0]).toEqual({
      member_name: 'Alice',
      wallet_address: '0x1111',
      rank: 1,
      score: 950,
      session_id: 'sess_1',
      session_name: 'Fractal Q1',
      session_date: '2026-01-15',
    });
    expect(body[1]).toEqual({
      member_name: 'Bob',
      wallet_address: '0x2222',
      rank: 2,
      score: 850,
      session_id: 'sess_2',
      session_name: 'Fractal Q1',
      session_date: '2026-01-15',
    });
  });

  it('handles null fractal_sessions in respect export', async () => {
    const mockData = [
      {
        member_name: 'Charlie',
        wallet_address: '0x3333',
        rank: 3,
        score: 750,
        session_id: 'sess_3',
        fractal_sessions: null,
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'respect', format: 'json' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body[0]).toEqual({
      member_name: 'Charlie',
      wallet_address: '0x3333',
      rank: 3,
      score: 750,
      session_id: 'sess_3',
      session_name: null,
      session_date: null,
    });
  });

  it('limits respect export to 5000 rows', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/admin/export', { type: 'respect' }));
    expect(chain.limit).toHaveBeenCalledWith(5000);
  });

  it('exports respect scores as CSV', async () => {
    const mockData = [
      {
        member_name: 'Alice',
        wallet_address: '0x1111',
        rank: 1,
        score: 950,
        session_id: 'sess_1',
        fractal_sessions: { name: 'Q1', session_date: '2026-01-15' },
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'respect' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');

    const body = await res.text();
    const lines = body.split('\n');
    expect(lines[0]).toContain('member_name');
    expect(lines[0]).toContain('session_name');
    expect(lines[1]).toContain('Alice');
    expect(lines[1]).toContain('Q1');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Sessions Export
  // ─────────────────────────────────────────────────────────────────────

  it('exports fractal sessions as CSV', async () => {
    const mockData = [
      {
        name: 'Fractal Q1 2026',
        session_date: '2026-01-15',
        scoring_era: 'v1',
        participant_count: 50,
        notes: 'First fractal of the year',
      },
      {
        name: 'Fractal Q2 2026',
        session_date: '2026-04-01',
        scoring_era: 'v1',
        participant_count: 60,
        notes: 'Second fractal',
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'sessions' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');

    const body = await res.text();
    const lines = body.split('\n');
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('session_date');
    expect(lines[0]).toContain('scoring_era');
    expect(lines[1]).toContain('Fractal Q1 2026');
    expect(lines[2]).toContain('Fractal Q2 2026');
  });

  it('exports sessions as JSON when format=json', async () => {
    const mockData = [
      {
        name: 'Fractal Q3 2026',
        session_date: '2026-07-01',
        scoring_era: 'v2',
        participant_count: 75,
        notes: null,
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(
      makeGetRequest('/api/admin/export', { type: 'sessions', format: 'json' }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');

    const body = await res.json();
    expect(body).toEqual(mockData);
  });

  it('orders sessions export by session_date descending', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/admin/export', { type: 'sessions' }));
    expect(chain.order).toHaveBeenCalledWith('session_date', { ascending: false });
  });

  // ─────────────────────────────────────────────────────────────────────
  // CSV Formatting & Safety
  // ─────────────────────────────────────────────────────────────────────

  it('escapes formula injection characters in CSV (equals, plus, minus, at)', async () => {
    const mockData = [
      {
        name: '=EXTERNAL("http://evil.com")',
        wallet_address: '+1-555-1234',
        fid: 999,
        total_respect: 0,
        fractal_respect: 0,
        fractal_count: 0,
        onchain_og: false,
        onchain_zor: false,
        hosting_respect: 0,
        bonus_respect: 0,
        event_respect: 0,
        first_respect_at: null,
      },
      {
        name: '@evil',
        wallet_address: '-9',
        fid: 888,
        total_respect: 0,
        fractal_respect: 0,
        fractal_count: 0,
        onchain_og: false,
        onchain_zor: false,
        hosting_respect: 0,
        bonus_respect: 0,
        event_respect: 0,
        first_respect_at: null,
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    const body = await res.text();

    // All dangerous prefixes should be escaped with a single quote
    expect(body).toContain("'=EXTERNAL");
    expect(body).toContain("'+1-555-1234");
    expect(body).toContain("'@evil");
    expect(body).toContain("'-9");
  });

  it('quotes CSV values that contain commas', async () => {
    const mockData = [
      {
        name: 'Smith, Alice',
        wallet_address: '0xabcd',
        fid: 1,
        total_respect: 500,
        fractal_respect: 200,
        fractal_count: 5,
        onchain_og: true,
        onchain_zor: false,
        hosting_respect: 100,
        bonus_respect: 0,
        event_respect: 200,
        first_respect_at: '2026-01-01',
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    const body = await res.text();
    const lines = body.split('\n');

    expect(lines[1]).toContain('"Smith, Alice"');
  });

  it('escapes quotes in CSV values by doubling them', async () => {
    const mockData = [
      {
        name: 'Alice "Ace" Johnson',
        wallet_address: '0x1234',
        fid: 100,
        total_respect: 500,
        fractal_respect: 200,
        fractal_count: 5,
        onchain_og: true,
        onchain_zor: false,
        hosting_respect: 100,
        bonus_respect: 0,
        event_respect: 200,
        first_respect_at: '2026-01-01',
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    const body = await res.text();

    // Quotes should be escaped as ""
    expect(body).toContain('"Alice ""Ace"" Johnson"');
  });

  it('handles newlines in CSV values by quoting the cell', async () => {
    const mockData = [
      {
        name: 'Alice\nBob',
        wallet_address: '0x1234',
        fid: 100,
        total_respect: 500,
        fractal_respect: 200,
        fractal_count: 5,
        onchain_og: true,
        onchain_zor: false,
        hosting_respect: 100,
        bonus_respect: 0,
        event_respect: 200,
        first_respect_at: '2026-01-01',
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    const body = await res.text();

    expect(body).toContain('"Alice\nBob"');
  });

  it('treats null and undefined as empty strings in CSV', async () => {
    const mockData = [
      {
        name: 'Charlie',
        wallet_address: null,
        fid: 200,
        total_respect: 300,
        fractal_respect: 100,
        fractal_count: 2,
        onchain_og: false,
        onchain_zor: false,
        hosting_respect: 0,
        bonus_respect: 0,
        event_respect: 200,
        first_respect_at: undefined,
      },
    ];
    const chain = exportChain({ data: mockData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    const body = await res.text();
    const lines = body.split('\n');

    // Row should have empty fields for null/undefined
    expect(lines[1]).toMatch(/Charlie,,200/);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Content-Disposition Headers
  // ─────────────────────────────────────────────────────────────────────

  it('sets correct Content-Disposition header for CSV exports', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    const disposition = res.headers.get('Content-Disposition');

    expect(disposition).toMatch(/^attachment; filename="zao-members-\d{4}-\d{2}-\d{2}\.csv"$/);
  });

  it('sets correct Content-Disposition header for JSON exports', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'respect', format: 'json' }));
    const disposition = res.headers.get('Content-Disposition');

    expect(disposition).toMatch(/^attachment; filename="zao-respect-\d{4}-\d{2}-\d{2}\.json"$/);
  });

  it('includes the current date in the filename', async () => {
    const chain = exportChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'sessions' }));
    const disposition = res.headers.get('Content-Disposition');

    // Verify that filename contains a date YYYY-MM-DD format
    expect(disposition).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Error Handling
  // ─────────────────────────────────────────────────────────────────────

  it('returns 500 when members query errors', async () => {
    const chain = exportChain({ data: null, error: new Error('db connection failed') });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('returns 500 when respect query errors', async () => {
    const chain = exportChain({ data: null, error: new Error('quota exceeded') });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'respect' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('returns 500 when sessions query errors', async () => {
    const chain = exportChain({ data: null, error: new Error('timeout') });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/admin/export', { type: 'sessions' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('logs the error when an exception occurs', async () => {
    const { logger } = await import('@/lib/logger');
    const chain = exportChain({ data: null, error: new Error('critical failure') });
    mockFrom.mockReturnValue(chain);

    await GET(makeGetRequest('/api/admin/export', { type: 'members' }));
    expect(logger.error).toHaveBeenCalledWith('[admin/export] Error:', expect.any(Error));
  });
});
