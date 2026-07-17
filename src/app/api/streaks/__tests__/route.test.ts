// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockMaybeSingle = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    }),
  },
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 11 };

describe('GET /api/streaks', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns zero-defaults when no streak record exists', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.streak.currentStreak).toBe(0);
    expect(body.streak.isActiveToday).toBe(false);
  });

  it('returns streak data with computed isActiveToday and isAtRisk', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    // last_activity_date = today
    const todayStr = new Date().toISOString().split('T')[0];
    mockMaybeSingle.mockResolvedValue({
      data: {
        current_streak: 5,
        longest_streak: 10,
        last_activity_date: todayStr,
        total_active_days: 20,
        streak_freezes_available: 2,
      },
      error: null,
    });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.streak.currentStreak).toBe(5);
    expect(body.streak.isActiveToday).toBe(true);
    expect(body.streak.isAtRisk).toBe(false);
  });

  it('returns 500 when Supabase returns an error', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
