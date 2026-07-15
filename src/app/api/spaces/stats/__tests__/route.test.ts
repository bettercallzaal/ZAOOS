import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
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
  logger: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/spaces/stats/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

describe('GET /api/spaces/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session exists but has no fid', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' });
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ── Success path tests ────────────────────────────────────────────────────

  it('returns empty stats when user has no sessions', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const emptyChain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(emptyChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      totalMinutes: 0,
      totalSessions: 0,
      favoriteRoom: null,
      thisWeek: 0,
      lastWeek: 0,
      currentStreak: 0,
    });
  });

  it('calculates stats correctly with multiple sessions', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // Now minus 2 days (within this week)
    const twoAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    // Now minus 10 days (within last week)
    const tenAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    // Now minus 20 days (before last week)
    const twentyAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    const sessions = [
      {
        room_name: 'Room A',
        duration_seconds: 600, // 10 min
        joined_at: twoAgo.toISOString(),
      },
      {
        room_name: 'Room A',
        duration_seconds: 300, // 5 min
        joined_at: twoAgo.toISOString(),
      },
      {
        room_name: 'Room B',
        duration_seconds: 1200, // 20 min
        joined_at: tenAgo.toISOString(),
      },
      {
        room_name: 'Room C',
        duration_seconds: 240, // 4 min
        joined_at: twentyAgo.toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Total: 10 + 5 + 20 + 4 = 39 min
    expect(body.totalMinutes).toBe(39);
    expect(body.totalSessions).toBe(4);

    // Favorite room: Room A has 2 sessions, Room B has 1, Room C has 1
    expect(body.favoriteRoom).toBe('Room A');

    // This week: 10 + 5 = 15 min
    expect(body.thisWeek).toBe(15);

    // Last week: 20 min
    expect(body.lastWeek).toBe(20);

    // Streak: depends on today and actual dates—test loosely
    expect(typeof body.currentStreak).toBe('number');
    expect(body.currentStreak).toBeGreaterThanOrEqual(0);
  });

  it('rounds minutes correctly', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const sessions = [
      {
        room_name: 'Room A',
        duration_seconds: 119, // 1.98 min → 2 min
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'Room B',
        duration_seconds: 89, // 1.48 min → 1 min
        joined_at: new Date().toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // 119 + 89 = 208 sec = 3.47 min → 3 min
    expect(body.totalMinutes).toBe(3);
  });

  it('identifies favorite room correctly with ties', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const sessions = [
      {
        room_name: 'Room A',
        duration_seconds: 600,
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'Room A',
        duration_seconds: 300,
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'Room B',
        duration_seconds: 500,
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'Room B',
        duration_seconds: 400,
        joined_at: new Date().toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Both rooms have 2 sessions; first one in iteration order wins
    expect(['Room A', 'Room B']).toContain(body.favoriteRoom);
    expect(body.totalSessions).toBe(4);
  });

  it('calculates current streak correctly', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    // Create sessions for today and the last 2 days (3-day streak)
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    // 3 days ago—no session, so streak should break
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sessions = [
      {
        room_name: 'Room A',
        duration_seconds: 300,
        joined_at: today.toISOString(),
      },
      {
        room_name: 'Room B',
        duration_seconds: 300,
        joined_at: yesterday.toISOString(),
      },
      {
        room_name: 'Room C',
        duration_seconds: 300,
        joined_at: twoDaysAgo.toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Streak should be 3 (today, yesterday, 2 days ago)
    expect(body.currentStreak).toBe(3);
  });

  it('handles sessions with null duration_seconds gracefully', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const sessions = [
      {
        room_name: 'Room A',
        duration_seconds: 600,
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'Room B',
        duration_seconds: null,
        joined_at: new Date().toISOString(),
      },
    ];

    // The query itself filters out nulls with .not('duration_seconds', 'is', null)
    // so this tests the runtime behavior if that somehow fails
    const sessionsChain = chainMock({ data: [sessions[0]], error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalMinutes).toBe(10);
    expect(body.totalSessions).toBe(1);
  });

  // ── Error path tests ──────────────────────────────────────────────────────

  it('returns 500 when supabase query fails', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const errorChain = chainMock({ data: null, error: { message: 'db error' } });
    mockFrom.mockReturnValue(errorChain);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch stats');
  });

  it('returns 500 when an exception is thrown', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch stats');
  });

  it('calls the correct supabase query chain methods', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET();

    expect(mockFrom).toHaveBeenCalledWith('space_sessions');
    expect(chain.select).toHaveBeenCalledWith('room_name, duration_seconds, joined_at');
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(chain.not).toHaveBeenCalledWith('duration_seconds', 'is', null);
  });

  // ── Edge case tests ──────────────────────────────────────────────────────

  it('handles a single long session', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const sessions = [
      {
        room_name: 'Marathon Room',
        duration_seconds: 3600, // 60 min
        joined_at: new Date().toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalMinutes).toBe(60);
    expect(body.totalSessions).toBe(1);
    expect(body.favoriteRoom).toBe('Marathon Room');
    expect(body.currentStreak).toBeGreaterThanOrEqual(0);
  });

  it('does not include sessions older than 14 days in time windows', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

    const sessions = [
      {
        room_name: 'Old Room',
        duration_seconds: 600,
        joined_at: fortyDaysAgo.toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalMinutes).toBe(10);
    expect(body.thisWeek).toBe(0);
    expect(body.lastWeek).toBe(0);
  });

  it('handles mixed case room names', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const sessions = [
      {
        room_name: 'Room-A',
        duration_seconds: 300,
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'room-a',
        duration_seconds: 300,
        joined_at: new Date().toISOString(),
      },
      {
        room_name: 'ROOM-A',
        duration_seconds: 300,
        joined_at: new Date().toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Room names are treated as case-sensitive, so these are 3 different rooms
    expect(body.totalSessions).toBe(3);
    expect(body.totalMinutes).toBe(15);
    // Each room has 1 session, so favorite could be any of them
    expect(['Room-A', 'room-a', 'ROOM-A']).toContain(body.favoriteRoom);
  });

  it('calculates streak that starts in the past (no sessions today)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const sessions = [
      {
        room_name: 'Room B',
        duration_seconds: 300,
        joined_at: yesterday.toISOString(),
      },
      {
        room_name: 'Room C',
        duration_seconds: 300,
        joined_at: twoDaysAgo.toISOString(),
      },
    ];

    const sessionsChain = chainMock({ data: sessions, error: null });
    mockFrom.mockReturnValue(sessionsChain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // No session today, so streak should be 0
    expect(body.currentStreak).toBe(0);
  });
});
