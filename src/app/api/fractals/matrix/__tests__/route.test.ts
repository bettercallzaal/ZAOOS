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
 * A Supabase query chain that supports .select(), .order(), and resolves
 * (when awaited) to `result`. Lets tests inspect order/select calls without
 * a live DB.
 */
function matrixChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order']) {
    chain[m] = vi.fn(() => chain);
  }
  // The route awaits the chain directly (no .single()).
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/fractals/matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Empty data (all arrays null)
  // ─────────────────────────────────────────────────────────────────────────

  it('returns empty matrix when all queries return null', async () => {
    const sessionsCall = matrixChain({ data: null, error: null });
    const membersCall = matrixChain({ data: null, error: null });
    const scoresCall = matrixChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.sessions).toEqual([]);
    expect(body.members).toEqual([]);
    expect(body.cells).toEqual([]);
    expect(body.stats).toEqual({
      totalSessions: 0,
      totalMembers: 0,
      totalRespect: 0,
    });
  });

  it('returns empty arrays when all queries return empty arrays', async () => {
    const sessionsCall = matrixChain({ data: [], error: null });
    const membersCall = matrixChain({ data: [], error: null });
    const scoresCall = matrixChain({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.sessions).toEqual([]);
    expect(body.members).toEqual([]);
    expect(body.cells).toEqual([]);
    expect(body.stats.totalSessions).toBe(0);
    expect(body.stats.totalMembers).toBe(0);
    expect(body.stats.totalRespect).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Populated data
  // ─────────────────────────────────────────────────────────────────────────

  it('returns sessions in chronological order', async () => {
    const sessions = [
      { id: 's1', name: 'Session 1', session_date: '2026-01-01' },
      { id: 's2', name: 'Session 2', session_date: '2026-01-02' },
    ];

    const sessionsCall = matrixChain({ data: sessions, error: null });
    mockFrom.mockReturnValue(matrixChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.sessions).toEqual(sessions);
    expect(body.stats.totalSessions).toBe(2);
  });

  it('orders sessions chronologically (ascending) with nullsFirst false', async () => {
    const sessions = [{ id: 's1', name: 'Session 1', session_date: '2026-01-01' }];
    const chain = matrixChain({ data: sessions, error: null });
    mockFrom.mockReturnValue(chain);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return chain;
      return matrixChain({ data: [], error: null });
    });

    await GET(makeGetRequest('/api/fractals/matrix'));

    expect(chain.order).toHaveBeenCalledWith('session_date', {
      ascending: true,
      nullsFirst: false,
    });
  });

  it('returns members ranked by total_respect descending', async () => {
    const members = [
      { name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 },
      { name: 'Bob', wallet_address: '0xbbb', fid: 2, total_respect: 50 },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    mockFrom.mockReturnValue(matrixChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.members).toHaveLength(2);
    expect(body.members[0].name).toBe('Alice');
    expect(body.members[0].totalRespect).toBe(100);
    expect(body.members[1].name).toBe('Bob');
    expect(body.members[1].totalRespect).toBe(50);
  });

  it('orders members by total_respect descending', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const chain = matrixChain({ data: members, error: null });
    mockFrom.mockReturnValue(chain);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return chain;
      return matrixChain({ data: [], error: null });
    });

    await GET(makeGetRequest('/api/fractals/matrix'));

    expect(chain.order).toHaveBeenCalledWith('total_respect', { ascending: false });
  });

  it('transforms member fields correctly (snake_case to camelCase)', async () => {
    const members = [
      { name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 },
      { name: 'Bob', wallet_address: null, fid: null, total_respect: 50 },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    mockFrom.mockReturnValue(matrixChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.members[0]).toEqual({
      name: 'Alice',
      wallet: '0xaaa',
      fid: 1,
      totalRespect: 100,
    });
    expect(body.members[1]).toEqual({
      name: 'Bob',
      wallet: null,
      fid: null,
      totalRespect: 50,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Matrix cell construction and matching
  // ─────────────────────────────────────────────────────────────────────────

  it('builds matrix cells by matching member_name (case-insensitive)', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const scores = [{ session_id: 's1', member_name: 'ALICE', wallet_address: '0xaaa', score: 10 }];

    const sessionsCall = matrixChain({ data: [], error: null });
    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.cells).toHaveLength(1);
    expect(body.cells[0]).toEqual({
      memberId: 'Alice',
      sessionId: 's1',
      score: 10,
    });
  });

  it('skips cells with null or undefined member_name', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const scores = [
      { session_id: 's1', member_name: null, wallet_address: '0xaaa', score: 10 },
      { session_id: 's1', member_name: undefined, wallet_address: '0xaaa', score: 10 },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.cells).toEqual([]);
  });

  it('skips cells with null or missing session_id', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const scores = [
      { session_id: null, member_name: 'Alice', wallet_address: '0xaaa', score: 10 },
      { session_id: undefined, member_name: 'Alice', wallet_address: '0xaaa', score: 10 },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.cells).toEqual([]);
  });

  it('skips cells with null or missing score', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const scores = [
      { session_id: 's1', member_name: 'Alice', wallet_address: '0xaaa', score: null },
      { session_id: 's1', member_name: 'Alice', wallet_address: '0xaaa', score: undefined },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.cells).toEqual([]);
  });

  it('skips cells when member_name does not match any member (case-insensitive)', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const scores = [
      { session_id: 's1', member_name: 'Unknown', wallet_address: '0xaaa', score: 10 },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.cells).toEqual([]);
  });

  it('converts score to number', async () => {
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];
    const scores = [
      { session_id: 's1', member_name: 'Alice', wallet_address: '0xaaa', score: '42' },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.cells[0].score).toBe(42);
    expect(typeof body.cells[0].score).toBe('number');
  });

  it('builds matrix with multiple members and sessions', async () => {
    const sessions = [
      { id: 's1', name: 'Session 1', session_date: '2026-01-01' },
      { id: 's2', name: 'Session 2', session_date: '2026-01-02' },
    ];
    const members = [
      { name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 },
      { name: 'Bob', wallet_address: '0xbbb', fid: 2, total_respect: 50 },
    ];
    const scores = [
      { session_id: 's1', member_name: 'Alice', wallet_address: '0xaaa', score: 10 },
      { session_id: 's1', member_name: 'Bob', wallet_address: '0xbbb', score: 5 },
      { session_id: 's2', member_name: 'Alice', wallet_address: '0xaaa', score: 8 },
    ];

    const sessionsCall = matrixChain({ data: sessions, error: null });
    const membersCall = matrixChain({ data: members, error: null });
    const scoresCall = matrixChain({ data: scores, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.cells).toHaveLength(3);
    expect(body.cells[0]).toEqual({ memberId: 'Alice', sessionId: 's1', score: 10 });
    expect(body.cells[1]).toEqual({ memberId: 'Bob', sessionId: 's1', score: 5 });
    expect(body.cells[2]).toEqual({ memberId: 'Alice', sessionId: 's2', score: 8 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics computation
  // ─────────────────────────────────────────────────────────────────────────

  it('computes totalRespect as sum of all member totalRespect', async () => {
    const members = [
      { name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 },
      { name: 'Bob', wallet_address: '0xbbb', fid: 2, total_respect: 50 },
      { name: 'Charlie', wallet_address: '0xccc', fid: 3, total_respect: 30 },
    ];

    const membersCall = matrixChain({ data: members, error: null });
    mockFrom.mockReturnValue(matrixChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'respect_members') return membersCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.stats.totalRespect).toBe(180);
  });

  it('returns correct stats structure', async () => {
    const sessions = [{ id: 's1', name: 'Session 1', session_date: '2026-01-01' }];
    const members = [{ name: 'Alice', wallet_address: '0xaaa', fid: 1, total_respect: 100 }];

    const sessionsCall = matrixChain({ data: sessions, error: null });
    const membersCall = matrixChain({ data: members, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      return matrixChain({ data: [], error: null });
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    const body = await res.json();
    expect(body.stats).toEqual({
      totalSessions: 1,
      totalMembers: 1,
      totalRespect: 100,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: Supabase query failures
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when sessions query errors', async () => {
    mockFrom.mockReturnValue(matrixChain({ data: null, error: new Error('db down') }));

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load matrix data');
  });

  it('returns 500 when members query errors', async () => {
    const sessionsCall = matrixChain({ data: [], error: null });
    const membersCall = matrixChain({ data: null, error: new Error('members query failed') });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load matrix data');
  });

  it('returns 500 when scores query errors', async () => {
    const sessionsCall = matrixChain({ data: [], error: null });
    const membersCall = matrixChain({ data: [], error: null });
    const scoresCall = matrixChain({ data: null, error: new Error('scores query failed') });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load matrix data');
  });

  it('logs error when queries fail', async () => {
    const { logger } = await import('@/lib/logger');

    mockFrom.mockReturnValue(matrixChain({ data: null, error: new Error('db error') }));

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith('Fractals matrix error:', expect.any(Error));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error handling: Unexpected runtime errors
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 and logs error when an unexpected error is thrown', async () => {
    const { logger } = await import('@/lib/logger');

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected runtime error');
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load matrix data');
    expect(logger.error).toHaveBeenCalledWith('Fractals matrix error:', expect.any(Error));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Response shape and types
  // ─────────────────────────────────────────────────────────────────────────

  it('returns MatrixResponse with all required fields', async () => {
    const sessionsCall = matrixChain({ data: [], error: null });
    const membersCall = matrixChain({ data: [], error: null });
    const scoresCall = matrixChain({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fractal_sessions') return sessionsCall;
      if (table === 'respect_members') return membersCall;
      if (table === 'fractal_scores') return scoresCall;
      return sessionsCall;
    });

    const res = await GET(makeGetRequest('/api/fractals/matrix'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('sessions');
    expect(body).toHaveProperty('members');
    expect(body).toHaveProperty('cells');
    expect(body).toHaveProperty('stats');
  });
});
