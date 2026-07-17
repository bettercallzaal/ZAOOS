// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { endRoomSessions, endSessionByFid, getLeaderboard, startSession } from '../sessionsDb';

afterEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// startSession
// ---------------------------------------------------------------------------
describe('startSession', () => {
  it('returns session ID after closing any existing sessions', async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        // endSessionByFid: fetch open sessions — none found
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      // insert new session
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'sess-abc' }, error: null }),
          }),
        }),
      };
    });
    const id = await startSession(1, 'room-1', 'ZAO Stage', 'stage');
    expect(id).toBe('sess-abc');
  });

  it('throws when insert fails', async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection refused' } }),
          }),
        }),
      };
    });
    await expect(startSession(1, 'room-1', 'ZAO Stage', 'stage')).rejects.toThrow(
      'Failed to start session',
    );
  });
});

// ---------------------------------------------------------------------------
// endSessionByFid
// ---------------------------------------------------------------------------
describe('endSessionByFid', () => {
  it('is a no-op when no open sessions exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    });
    await expect(endSessionByFid(1, 'room-1')).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('throws on fetch error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } }),
            }),
          }),
        }),
      }),
    });
    await expect(endSessionByFid(1, 'room-1')).rejects.toThrow('Failed to fetch open sessions');
  });

  it('closes open sessions and calls update with id', async () => {
    const sessions = [{ id: 'sess-1', joined_at: new Date(Date.now() - 60_000).toISOString() }];
    let call = 0;
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: sessions, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return { update: vi.fn().mockReturnValue({ eq: mockUpdateEq }) };
    });
    await endSessionByFid(1, 'room-1');
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'sess-1');
  });
});

// ---------------------------------------------------------------------------
// endRoomSessions
// ---------------------------------------------------------------------------
describe('endRoomSessions', () => {
  it('is a no-op when no open sessions in room', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    await expect(endRoomSessions('room-1')).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('closes all open sessions in the room', async () => {
    const sessions = [
      { id: 'sess-1', joined_at: new Date(Date.now() - 120_000).toISOString() },
      { id: 'sess-2', joined_at: new Date(Date.now() - 60_000).toISOString() },
    ];
    let call = 0;
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ data: sessions, error: null }),
            }),
          }),
        };
      }
      return { update: vi.fn().mockReturnValue({ eq: mockUpdateEq }) };
    });
    await endRoomSessions('room-1');
    expect(mockUpdateEq).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// getLeaderboard
// ---------------------------------------------------------------------------
describe('getLeaderboard', () => {
  it('returns empty array when no sessions', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const result = await getLeaderboard('all');
    expect(result).toEqual([]);
  });

  it('aggregates sessions and returns leaderboard sorted by totalMinutes', async () => {
    const rows = [
      { fid: 1, room_name: 'ZAO Stage', duration_seconds: 3600 },
      { fid: 2, room_name: 'ZAO Lounge', duration_seconds: 1800 },
      { fid: 1, room_name: 'ZAO Stage', duration_seconds: 600 },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    });
    const result = await getLeaderboard('all');
    expect(result[0].fid).toBe(1);
    expect(result[0].totalMinutes).toBe(Math.round(4200 / 60));
    expect(result[0].favoriteRoom).toBe('ZAO Stage');
    expect(result[0].sessionCount).toBe(2);
  });

  it('applies gte filter for week period', async () => {
    const mockGte = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({ gte: mockGte }),
      }),
    });
    await getLeaderboard('week');
    expect(mockGte).toHaveBeenCalledWith('joined_at', expect.any(String));
  });

  it('throws on DB error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    });
    await expect(getLeaderboard('all')).rejects.toThrow('Failed to fetch leaderboard');
  });
});
