import { supabaseAdmin } from '@/lib/db/supabase';

export interface SpaceSession {
  id: string;
  fid: number;
  room_id: string;
  room_name: string;
  room_type: 'voice_channel' | 'stage';
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;
}

export interface LeaderboardEntry {
  fid: number;
  totalMinutes: number;
  sessionCount: number;
  favoriteRoom: string;
}

/**
 * Start a new session when a user joins a room.
 * Returns the session ID.
 *
 * Closes any already-open session for this (fid, room) first so a double-join
 * (StrictMode re-mount, reconnect, second tab) can never leave two open rows
 * racing to be closed — the prior row is settled before the new one opens.
 */
export async function startSession(
  fid: number,
  roomId: string,
  roomName: string,
  roomType: 'voice_channel' | 'stage'
): Promise<string> {
  await endSessionByFid(fid, roomId);

  const { data, error } = await supabaseAdmin
    .from('space_sessions')
    .insert({
      fid,
      room_id: roomId,
      room_name: roomName,
      room_type: roomType,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to start session: ${error.message}`);
  return data.id;
}

/**
 * End every open session for a user in a specific room.
 *
 * Closes all rows where left_at is null (not just the most recent) so a user
 * who somehow accumulated duplicate open rows is fully settled — each row gets
 * a duration computed from its own joined_at. A missing open session is a no-op.
 */
export async function endSessionByFid(fid: number, roomId: string): Promise<void> {
  const { data: sessions, error: fetchError } = await supabaseAdmin
    .from('space_sessions')
    .select('id, joined_at')
    .eq('fid', fid)
    .eq('room_id', roomId)
    .is('left_at', null)
    .order('joined_at', { ascending: false });

  if (fetchError) throw new Error(`Failed to fetch open sessions: ${fetchError.message}`);
  if (!sessions || sessions.length === 0) return; // No open session — nothing to do

  const leftAt = new Date().toISOString();
  const results = await Promise.allSettled(
    sessions.map((session) => {
      const durationSeconds = Math.floor(
        (Date.now() - new Date(session.joined_at).getTime()) / 1000
      );
      return supabaseAdmin
        .from('space_sessions')
        .update({ left_at: leftAt, duration_seconds: durationSeconds })
        .eq('id', session.id)
        .then(({ error }) => {
          if (error) throw new Error(error.message);
        });
    })
  );

  const failed = results.find((r) => r.status === 'rejected');
  if (failed && failed.status === 'rejected') {
    throw new Error(`Failed to end session: ${failed.reason}`);
  }
}

/**
 * End every open session in a room, regardless of fid.
 *
 * Called when a room itself ends (host left / room swept) so listeners who never
 * fired their own leave never strand an open row — each is closed with a duration
 * from its own joined_at. Best-effort: logs nothing, throws only on hard failure.
 */
export async function endRoomSessions(roomId: string): Promise<void> {
  const { data: sessions, error: fetchError } = await supabaseAdmin
    .from('space_sessions')
    .select('id, joined_at')
    .eq('room_id', roomId)
    .is('left_at', null);

  if (fetchError) throw new Error(`Failed to fetch room sessions: ${fetchError.message}`);
  if (!sessions || sessions.length === 0) return;

  const leftAt = new Date().toISOString();
  await Promise.allSettled(
    sessions.map((session) => {
      const durationSeconds = Math.floor(
        (Date.now() - new Date(session.joined_at).getTime()) / 1000
      );
      return supabaseAdmin
        .from('space_sessions')
        .update({ left_at: leftAt, duration_seconds: durationSeconds })
        .eq('id', session.id);
    })
  );
}

/**
 * Get the leaderboard of users sorted by total time spent in spaces.
 * Period: 'week' (last 7 days), 'month' (last 30 days), 'all' (no filter).
 */
export async function getLeaderboard(
  period: 'week' | 'month' | 'all' = 'all',
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  let query = supabaseAdmin
    .from('space_sessions')
    .select('fid, room_name, duration_seconds')
    .not('duration_seconds', 'is', null);

  // Apply period filter
  if (period === 'week') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('joined_at', since);
  } else if (period === 'month') {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('joined_at', since);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  if (!data || data.length === 0) return [];

  // Aggregate in JS since Supabase REST API doesn't support GROUP BY
  const byFid = new Map<number, { totalSeconds: number; sessionCount: number; roomCounts: Map<string, number> }>();

  for (const row of data) {
    const entry = byFid.get(row.fid) || { totalSeconds: 0, sessionCount: 0, roomCounts: new Map() };
    entry.totalSeconds += row.duration_seconds || 0;
    entry.sessionCount += 1;
    entry.roomCounts.set(row.room_name, (entry.roomCounts.get(row.room_name) || 0) + 1);
    byFid.set(row.fid, entry);
  }

  // Convert to sorted array
  const leaderboard: LeaderboardEntry[] = [];
  for (const [fid, entry] of byFid) {
    // Find most-visited room
    let favoriteRoom = '';
    let maxCount = 0;
    for (const [room, count] of entry.roomCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteRoom = room;
      }
    }

    leaderboard.push({
      fid,
      totalMinutes: Math.round(entry.totalSeconds / 60),
      sessionCount: entry.sessionCount,
      favoriteRoom,
    });
  }

  leaderboard.sort((a, b) => b.totalMinutes - a.totalMinutes);
  return leaderboard.slice(0, limit);
}
