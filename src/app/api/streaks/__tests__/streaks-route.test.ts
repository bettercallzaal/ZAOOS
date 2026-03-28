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

import { GET } from '@/app/api/streaks/route';
import { chainMock, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD (the format stored in user_streaks). */
function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = today();
  d.setDate(d.getDate() - n);
  return d;
}

function makeStreakRow(overrides: Record<string, unknown> = {}) {
  return {
    current_streak: 5,
    longest_streak: 12,
    last_activity_date: toDateStr(today()),
    total_active_days: 42,
    streak_freezes_available: 2,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/streaks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Auth ---------------------------------------------------------------

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  // ---- DB error -----------------------------------------------------------

  it('returns 500 on database error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const { chain } = chainMock({
      data: null,
      error: { message: 'connection failed' },
    });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to fetch streak data' });
  });

  // ---- No streak record ---------------------------------------------------

  it('returns defaults when no streak record exists', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const { streak } = await res.json();
    expect(streak).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      totalActiveDays: 0,
      streakFreezesAvailable: 0,
      isActiveToday: false,
      isAtRisk: false,
    });
  });

  // ---- Active today -------------------------------------------------------

  it('returns isActiveToday true when last activity is today', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const row = makeStreakRow({ last_activity_date: toDateStr(today()) });
    const { chain } = chainMock({ data: row, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const { streak } = await res.json();
    expect(streak.isActiveToday).toBe(true);
    expect(streak.isAtRisk).toBe(false);
    expect(streak.currentStreak).toBe(5);
    expect(streak.longestStreak).toBe(12);
    expect(streak.totalActiveDays).toBe(42);
    expect(streak.streakFreezesAvailable).toBe(2);
  });

  // ---- At risk (yesterday) ------------------------------------------------

  it('returns isAtRisk true when last activity was yesterday', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const row = makeStreakRow({ last_activity_date: toDateStr(daysAgo(1)) });
    const { chain } = chainMock({ data: row, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const { streak } = await res.json();
    expect(streak.isActiveToday).toBe(false);
    expect(streak.isAtRisk).toBe(true);
    expect(streak.currentStreak).toBe(5); // preserved — not yet broken
  });

  // ---- Lapsed (2+ days ago) -----------------------------------------------

  it('resets currentStreak to 0 when last activity was 2+ days ago', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const row = makeStreakRow({
      last_activity_date: toDateStr(daysAgo(3)),
      current_streak: 10,
    });
    const { chain } = chainMock({ data: row, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const { streak } = await res.json();
    expect(streak.isActiveToday).toBe(false);
    expect(streak.isAtRisk).toBe(false);
    expect(streak.currentStreak).toBe(0); // lapsed — reset
    expect(streak.longestStreak).toBe(12); // longestStreak unchanged
  });
});
