/**
 * Keep hidden casts out of every surface that reads `channel_casts`.
 *
 * `hidden_messages` holds casts a moderator hid and, since #3852, casts their
 * author deleted on Farcaster. `/api/chat/messages` and `/api/chat/search`
 * already filter on it. `/api/search`, `/api/activity/feed` and
 * `/api/users/[fid]` did not, so a hidden or withdrawn cast still showed in
 * global search, in the activity feed and in a member's engagement totals.
 * That was the gap #3852 named ("NOT COVERED" in cast-tombstone.ts).
 *
 * DEFAULT OFF. Runs only when `HIDDEN_CASTS_EVERYWHERE` is exactly `1`. With
 * the flag off the rows come back untouched and no query is made.
 *
 * FAILS CLOSED. If `hidden_messages` cannot be read we cannot tell which casts
 * were withdrawn, so no casts are returned and the failure is logged at error
 * level. The chat routes ignore that error and show everything; for a
 * withdrawal guarantee the safe answer is to show nothing.
 */
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/** True only when the flag is exactly '1'. */
export function hiddenCastsEverywhereEnabled(): boolean {
  return process.env.HIDDEN_CASTS_EVERYWHERE === '1';
}

/** Returns `rows` without the casts listed in `hidden_messages`. Never throws. */
export async function dropHiddenCasts<T extends { hash: string }>(
  rows: T[],
  surface: string,
): Promise<T[]> {
  if (!hiddenCastsEverywhereEnabled() || rows.length === 0) return rows;
  try {
    const { data, error } = await supabaseAdmin
      .from('hidden_messages')
      .select('cast_hash')
      .in(
        'cast_hash',
        rows.map((r) => r.hash),
      );
    if (error) throw error;
    const hidden = new Set((data ?? []).map((h: { cast_hash: string }) => h.cast_hash));
    return hidden.size === 0 ? rows : rows.filter((r) => !hidden.has(r.hash));
  } catch (error: unknown) {
    logger.error(
      `[hidden-casts] ${surface}: hidden_messages unreadable, returning no casts`,
      error,
    );
    return [];
  }
}
