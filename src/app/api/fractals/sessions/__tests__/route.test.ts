import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
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
 * Chain for fractal_sessions queries: .select() -> .order() -> .range() -> resolve.
 * Supports the full Supabase chain with count: 'exact' option.
 */
function sessionsChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'range']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/fractals/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ===== Authentication =====
  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // ===== Query Validation =====
  it('accepts default limit and offset (no query params)', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(200);
    // Default limit=50, offset=0, so range should be (0, 49)
    expect(chain.range).toHaveBeenCalledWith(0, 49);
  });

  it('applies custom limit when provided', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '25' }));
    expect(res.status).toBe(200);
    // offset=0 (default), limit=25, so range should be (0, 24)
    expect(chain.range).toHaveBeenCalledWith(0, 24);
  });

  it('applies custom offset when provided', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions', { offset: '10' }));
    expect(res.status).toBe(200);
    // offset=10, limit=50 (default), so range should be (10, 59)
    expect(chain.range).toHaveBeenCalledWith(10, 59);
  });

  it('applies both limit and offset when provided', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '100', offset: '5' }));
    expect(res.status).toBe(200);
    // offset=5, limit=100, so range should be (5, 104)
    expect(chain.range).toHaveBeenCalledWith(5, 104);
  });

  it('rejects limit > 500', async () => {
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '501' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query params');
    expect(body.details).toBeDefined();
  });

  it('rejects limit < 1', async () => {
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query params');
  });

  it('rejects offset < 0', async () => {
    const res = await GET(makeGetRequest('/api/fractals/sessions', { offset: '-1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query params');
  });

  it('rejects non-integer limit', async () => {
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query params');
  });

  it('rejects non-integer offset', async () => {
    const res = await GET(makeGetRequest('/api/fractals/sessions', { offset: '12.5' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query params');
  });

  it('rejects decimal limits (Zod int() validation fails)', async () => {
    // Zod .int() rejects decimal values
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '25.9' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query params');
  });

  // ===== Success Cases =====
  it('returns empty list when no sessions exist', async () => {
    mockFrom.mockReturnValue(sessionsChain({ data: null, error: null, count: 0 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns sessions list when data exists', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        session_date: '2026-07-15',
        name: 'Fractal Alpha',
        host_name: 'Alice',
        scoring_era: 'era-1',
        participant_count: 10,
        notes: 'Great session',
        created_at: '2026-07-15T10:00:00Z',
        fractal_scores: [
          {
            id: 'score-1',
            member_name: 'Bob',
            wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
            rank: 1,
            score: 100,
          },
        ],
      },
    ];
    mockFrom.mockReturnValue(sessionsChain({ data: mockSessions, error: null, count: 1 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0]).toMatchObject({
      id: 'session-1',
      name: 'Fractal Alpha',
      host_name: 'Alice',
    });
    expect(body.total).toBe(1);
  });

  it('returns sessions with nested fractal_scores', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        session_date: '2026-07-15',
        name: 'Fractal Alpha',
        host_name: 'Alice',
        scoring_era: 'era-1',
        participant_count: 3,
        notes: 'Test session',
        created_at: '2026-07-15T10:00:00Z',
        fractal_scores: [
          {
            id: 'score-1',
            member_name: 'Bob',
            wallet_address: '0xaaaa',
            rank: 1,
            score: 100,
          },
          {
            id: 'score-2',
            member_name: 'Charlie',
            wallet_address: '0xbbbb',
            rank: 2,
            score: 85,
          },
          {
            id: 'score-3',
            member_name: 'Diana',
            wallet_address: '0xcccc',
            rank: 3,
            score: 70,
          },
        ],
      },
    ];
    mockFrom.mockReturnValue(sessionsChain({ data: mockSessions, error: null, count: 1 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const body = await res.json();
    expect(body.sessions[0].fractal_scores).toHaveLength(3);
    expect(body.sessions[0].fractal_scores[0].member_name).toBe('Bob');
    expect(body.sessions[0].fractal_scores[0].rank).toBe(1);
  });

  it('returns multiple sessions', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        session_date: '2026-07-15',
        name: 'Session 1',
        host_name: 'Host 1',
        scoring_era: 'era-1',
        participant_count: 5,
        notes: null,
        created_at: '2026-07-15T10:00:00Z',
        fractal_scores: [],
      },
      {
        id: 'session-2',
        session_date: '2026-07-14',
        name: 'Session 2',
        host_name: 'Host 2',
        scoring_era: 'era-1',
        participant_count: 8,
        notes: 'Notes here',
        created_at: '2026-07-14T10:00:00Z',
        fractal_scores: [],
      },
    ];
    mockFrom.mockReturnValue(sessionsChain({ data: mockSessions, error: null, count: 2 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const body = await res.json();
    expect(body.sessions).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it('returns exact count from Supabase', async () => {
    const mockSessions = [{ id: 'session-1' }];
    mockFrom.mockReturnValue(sessionsChain({ data: mockSessions, error: null, count: 1234 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const body = await res.json();
    expect(body.total).toBe(1234);
  });

  // ===== Supabase Query Shape =====
  it('calls supabase.from("fractal_sessions") with the correct select columns', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/fractals/sessions'));
    expect(mockFrom).toHaveBeenCalledWith('fractal_sessions');
    expect(chain.select).toHaveBeenCalled();
    // Verify the select argument contains the expected columns
    const selectCall = chain.select.mock.calls[0][0];
    expect(selectCall).toContain('id');
    expect(selectCall).toContain('session_date');
    expect(selectCall).toContain('name');
    expect(selectCall).toContain('host_name');
    expect(selectCall).toContain('scoring_era');
    expect(selectCall).toContain('participant_count');
    expect(selectCall).toContain('notes');
    expect(selectCall).toContain('created_at');
    expect(selectCall).toContain('fractal_scores');
  });

  it('orders by session_date descending', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/fractals/sessions'));
    expect(chain.order).toHaveBeenCalledWith('session_date', { ascending: false });
  });

  it('applies the range with correct offset and limit', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/fractals/sessions', { limit: '30', offset: '5' }));
    // offset=5, limit=30 => range(5, 34)
    expect(chain.range).toHaveBeenCalledWith(5, 34);
  });

  it('passes count option to select', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    await GET(makeGetRequest('/api/fractals/sessions'));
    // Check second argument to select
    const selectCall = chain.select.mock.calls[0];
    expect(selectCall[1]).toEqual({ count: 'exact' });
  });

  // ===== Error Handling =====
  it('returns 500 when Supabase query returns an error', async () => {
    mockFrom.mockReturnValue(
      sessionsChain({ data: null, error: new Error('Database connection failed') }),
    );
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load sessions');
  });

  it('catches thrown exceptions from Supabase and returns 500', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected runtime error');
    });
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load sessions');
  });

  it('logs errors to logger.error', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockReturnValue(sessionsChain({ data: null, error: new Error('Test error') }));
    await GET(makeGetRequest('/api/fractals/sessions'));
    expect(logger.error).toHaveBeenCalledWith('Fractal sessions error:', expect.any(Error));
  });

  // ===== Response Headers =====
  it('sets Cache-Control header with public, s-maxage, stale-while-revalidate', async () => {
    mockFrom.mockReturnValue(sessionsChain({ data: [], error: null, count: 0 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toBe('public, s-maxage=600, stale-while-revalidate=30');
  });

  // ===== Edge Cases =====
  it('handles null data by coercing to empty array', async () => {
    mockFrom.mockReturnValue(sessionsChain({ data: null, error: null, count: 0 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const body = await res.json();
    expect(body.sessions).toEqual([]);
  });

  it('handles null count by coercing to 0', async () => {
    mockFrom.mockReturnValue(sessionsChain({ data: [], error: null, count: null }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it('handles sessions with missing optional fields', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        session_date: '2026-07-15',
        name: 'Minimal Session',
        host_name: 'Host',
        scoring_era: null,
        participant_count: null,
        notes: null,
        created_at: '2026-07-15T10:00:00Z',
        fractal_scores: [],
      },
    ];
    mockFrom.mockReturnValue(sessionsChain({ data: mockSessions, error: null, count: 1 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions[0]).toMatchObject({
      id: 'session-1',
      name: 'Minimal Session',
      scoring_era: null,
    });
  });

  it('handles sessions with empty fractal_scores array', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        session_date: '2026-07-15',
        name: 'No Scores Session',
        host_name: 'Host',
        scoring_era: 'era-1',
        participant_count: 0,
        notes: null,
        created_at: '2026-07-15T10:00:00Z',
        fractal_scores: [],
      },
    ];
    mockFrom.mockReturnValue(sessionsChain({ data: mockSessions, error: null, count: 1 }));
    const res = await GET(makeGetRequest('/api/fractals/sessions'));
    const body = await res.json();
    expect(body.sessions[0].fractal_scores).toEqual([]);
  });

  it('respects max limit boundary (exactly 500)', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '500' }));
    expect(res.status).toBe(200);
    // limit=500, offset=0 => range(0, 499)
    expect(chain.range).toHaveBeenCalledWith(0, 499);
  });

  it('respects min limit boundary (exactly 1)', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions', { limit: '1' }));
    expect(res.status).toBe(200);
    // limit=1, offset=0 => range(0, 0)
    expect(chain.range).toHaveBeenCalledWith(0, 0);
  });

  it('respects min offset boundary (exactly 0)', async () => {
    const chain = sessionsChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const res = await GET(makeGetRequest('/api/fractals/sessions', { offset: '0' }));
    expect(res.status).toBe(200);
    expect(chain.range).toHaveBeenCalledWith(0, 49); // 0 + 50 - 1
  });
});
