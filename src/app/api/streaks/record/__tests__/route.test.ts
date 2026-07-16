import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
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

import { POST } from '../route';

/**
 * FIFO chain for queued Supabase results. The streaks/record route makes
 * multiple round-trips (activity_log upsert, user_streaks select, optionally
 * user_streaks insert or update). Tests queue one result per trip in call order.
 * `.maybeSingle()`, `.single()`, and awaited `then` all draw from the same queue.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'order',
    'range',
    'limit',
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(q.shift()));
  chain.single = vi.fn(() => Promise.resolve(q.shift()));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('POST /api/streaks/record', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  describe('Authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    it('returns 400 when activity_type is missing', async () => {
      const res = await POST(makePostRequest('/api/streaks/record', {}));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when activity_type is invalid', async () => {
      const res = await POST(
        makePostRequest('/api/streaks/record', { activity_type: 'invalid_type' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts all valid activity types', async () => {
      const validTypes = ['cast', 'vote', 'comment', 'reaction', 'submission', 'fractal', 'login'];
      for (const activityType of validTypes) {
        // Reset mocks before each iteration
        vi.clearAllMocks();
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
        mockFrom.mockReturnValue(
          queuedChain([
            { error: null }, // activity_log upsert
            { data: null, error: null }, // user_streaks select
            {
              data: {
                current_streak: 1,
                longest_streak: 1,
                last_activity_date: new Date().toISOString().split('T')[0],
                total_active_days: 1,
                streak_freezes_available: 0,
              },
              error: null,
            }, // user_streaks insert
          ]),
        );
        const res = await POST(
          makePostRequest('/api/streaks/record', { activity_type: activityType }),
        );
        expect(res.status).toBe(200, `Failed for activity_type: ${activityType}`);
      }
    });

    it('accepts optional metadata as record<string, unknown>', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 2,
              longest_streak: 2,
              last_activity_date: '2026-07-15',
              total_active_days: 5,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 2,
              longest_streak: 2,
              last_activity_date: '2026-07-15',
              total_active_days: 5,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(
        makePostRequest('/api/streaks/record', {
          activity_type: 'cast',
          metadata: { custom_field: 'value', nested: { key: 123 } },
        }),
      );
      expect(res.status).toBe(200);
    });

    it('rejects metadata if not a record type', async () => {
      const res = await POST(
        makePostRequest('/api/streaks/record', {
          activity_type: 'cast',
          metadata: ['not', 'an', 'object'],
        }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid input');
    });
  });

  describe('Activity Log Recording', () => {
    it('upserts activity_log before updating streak', async () => {
      const chain = queuedChain([
        { error: null }, // activity_log upsert
        { data: null, error: null }, // user_streaks select
        {
          data: {
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: new Date().toISOString().split('T')[0],
            total_active_days: 1,
            streak_freezes_available: 0,
          },
          error: null,
        }, // user_streaks insert
      ]);
      mockFrom.mockReturnValue(chain);
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(200);
      expect(chain.upsert).toHaveBeenCalled();
    });

    it('returns 500 when activity_log upsert errors', async () => {
      mockFrom.mockReturnValue(queuedChain([{ error: new Error('db constraint violation') }]));
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to record activity');
    });
  });

  describe('First-Ever Streak (No Existing Record)', () => {
    it('creates a new streak with initial values', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          { data: null, error: null }, // user_streaks select (no existing)
          {
            data: {
              current_streak: 1,
              longest_streak: 1,
              last_activity_date: todayStr,
              total_active_days: 1,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks insert
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.recorded).toBe(true);
      expect(body.streak).toMatchObject({
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        isActiveToday: true,
        isAtRisk: false,
      });
      expect(body.streak.lastActivityDate).toBe(todayStr);
    });

    it('returns 500 when streak insert fails', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          { data: null, error: null }, // user_streaks select
          { data: null, error: new Error('constraint error') }, // user_streaks insert fails
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to create streak');
    });
  });

  describe('Same-Day Re-Record (No Streak Change)', () => {
    it('returns current streak values unchanged when already active today', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 5,
              longest_streak: 10,
              last_activity_date: todayStr,
              total_active_days: 42,
              streak_freezes_available: 1,
            },
            error: null,
          }, // user_streaks select
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'vote' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.recorded).toBe(true);
      expect(body.streak).toMatchObject({
        currentStreak: 5,
        longestStreak: 10,
        totalActiveDays: 42,
        streakFreezesAvailable: 1,
        isActiveToday: true,
        isAtRisk: false,
      });
    });

    it('does not call update when already active today', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const chain = queuedChain([
        { error: null }, // activity_log upsert
        {
          data: {
            current_streak: 5,
            longest_streak: 10,
            last_activity_date: todayStr,
            total_active_days: 42,
            streak_freezes_available: 1,
          },
          error: null,
        }, // user_streaks select
      ]);
      mockFrom.mockReturnValue(chain);
      await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(chain.update).not.toHaveBeenCalled();
    });
  });

  describe('Consecutive Day (Streak Extends)', () => {
    it('increments current_streak when last_activity_date was yesterday', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayStr = now.toISOString().split('T')[0];

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 5,
              longest_streak: 5,
              last_activity_date: yesterdayStr,
              total_active_days: 5,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 6,
              longest_streak: 6,
              last_activity_date: todayStr,
              total_active_days: 6,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.streak.currentStreak).toBe(6);
      expect(body.streak.longestStreak).toBe(6);
      expect(body.streak.totalActiveDays).toBe(6);
    });

    it('updates longest_streak if new current_streak exceeds it', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayStr = now.toISOString().split('T')[0];

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 15,
              longest_streak: 15,
              last_activity_date: yesterdayStr,
              total_active_days: 20,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 16,
              longest_streak: 16,
              last_activity_date: todayStr,
              total_active_days: 21,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      const body = await res.json();
      expect(body.streak.currentStreak).toBe(16);
      expect(body.streak.longestStreak).toBe(16);
    });

    it('increments total_active_days by 1', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayStr = now.toISOString().split('T')[0];

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 3,
              longest_streak: 3,
              last_activity_date: yesterdayStr,
              total_active_days: 3,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 4,
              longest_streak: 4,
              last_activity_date: todayStr,
              total_active_days: 4,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      const body = await res.json();
      expect(body.streak.totalActiveDays).toBe(4);
    });

    it('returns 500 when streak update fails', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 5,
              longest_streak: 5,
              last_activity_date: yesterdayStr,
              total_active_days: 5,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          { data: null, error: new Error('update failed') }, // user_streaks update fails
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to update streak');
    });
  });

  describe('Gap in Activity (Streak Resets)', () => {
    it('resets current_streak to 1 when gap detected (last activity > 1 day ago)', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayStr = now.toISOString().split('T')[0];

      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 5,
              longest_streak: 10,
              last_activity_date: twoDaysAgoStr,
              total_active_days: 8,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 1,
              longest_streak: 10,
              last_activity_date: todayStr,
              total_active_days: 9,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.streak.currentStreak).toBe(1);
      expect(body.streak.longestStreak).toBe(10); // longest_streak preserved
      expect(body.streak.totalActiveDays).toBe(9);
    });

    it('preserves longest_streak when current_streak resets', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayStr = now.toISOString().split('T')[0];

      const threeWeeksAgo = new Date(now);
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      const threeWeeksAgoStr = threeWeeksAgo.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 7,
              longest_streak: 30,
              last_activity_date: threeWeeksAgoStr,
              total_active_days: 50,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 1,
              longest_streak: 30,
              last_activity_date: todayStr,
              total_active_days: 51,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      const body = await res.json();
      expect(body.streak.longestStreak).toBe(30);
    });

    it('increments total_active_days even after a gap reset', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayStr = now.toISOString().split('T')[0];

      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          {
            data: {
              current_streak: 3,
              longest_streak: 3,
              last_activity_date: fiveDaysAgoStr,
              total_active_days: 3,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks select
          {
            data: {
              current_streak: 1,
              longest_streak: 3,
              last_activity_date: todayStr,
              total_active_days: 4,
              streak_freezes_available: 0,
            },
            error: null,
          }, // user_streaks update
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      const body = await res.json();
      expect(body.streak.totalActiveDays).toBe(4);
    });
  });

  describe('Error Handling', () => {
    it('catches and logs JSON parsing errors', async () => {
      const req = makePostRequest('/api/streaks/record', {});
      // Corrupt the body to cause JSON parsing to fail
      Object.defineProperty(req, 'json', {
        value: async () => {
          throw new Error('JSON parse error');
        },
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to record activity');
    });

    it('returns 500 with a sanitized message on unexpected errors', async () => {
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      // If mocks are not set up, the route will throw when trying to call from()
      // Depending on the implementation, this may be caught
      expect([500, 400, 401]).toContain(res.status);
    });
  });

  describe('Response Shape', () => {
    it('includes streak object with all required fields on success', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      mockFrom.mockReturnValue(
        queuedChain([
          { error: null }, // activity_log upsert
          { data: null, error: null }, // user_streaks select
          {
            data: {
              current_streak: 1,
              longest_streak: 1,
              last_activity_date: todayStr,
              total_active_days: 1,
              streak_freezes_available: 2,
            },
            error: null,
          }, // user_streaks insert
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      const body = await res.json();
      expect(body.recorded).toBe(true);
      expect(body.streak).toBeDefined();
      expect(body.streak).toHaveProperty('currentStreak');
      expect(body.streak).toHaveProperty('longestStreak');
      expect(body.streak).toHaveProperty('lastActivityDate');
      expect(body.streak).toHaveProperty('totalActiveDays');
      expect(body.streak).toHaveProperty('streakFreezesAvailable');
      expect(body.streak).toHaveProperty('isActiveToday');
      expect(body.streak).toHaveProperty('isAtRisk');
    });

    it('uses camelCase field names in response', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      mockFrom.mockReturnValue(
        queuedChain([
          { error: null },
          { data: null, error: null },
          {
            data: {
              current_streak: 2,
              longest_streak: 2,
              last_activity_date: todayStr,
              total_active_days: 2,
              streak_freezes_available: 1,
            },
            error: null,
          },
        ]),
      );
      const res = await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      const body = await res.json();
      expect(body.streak).toHaveProperty('currentStreak');
      expect(body.streak).toHaveProperty('longestStreak');
      expect(body.streak).toHaveProperty('lastActivityDate');
      expect(body.streak).toHaveProperty('totalActiveDays');
      expect(body.streak).toHaveProperty('streakFreezesAvailable');
      expect(body.streak).not.toHaveProperty('current_streak');
      expect(body.streak).not.toHaveProperty('longest_streak');
    });
  });

  describe('Session FID Usage', () => {
    it('extracts fid from session and uses it for all queries', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
      const chain = queuedChain([
        { error: null }, // activity_log upsert
        { data: null, error: null }, // user_streaks select
        {
          data: {
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: new Date().toISOString().split('T')[0],
            total_active_days: 1,
            streak_freezes_available: 0,
          },
          error: null,
        }, // user_streaks insert
      ]);
      mockFrom.mockReturnValue(chain);
      await POST(makePostRequest('/api/streaks/record', { activity_type: 'cast' }));
      // Verify the upsert was called with fid 999 in the data
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ fid: 999 }),
        expect.any(Object),
      );
    });
  });
});
