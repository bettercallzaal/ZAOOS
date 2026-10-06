/**
 * Daily cap for official auto-casts to the /zao channel.
 *
 * `autoCastToZao` posts from the shared @thezao signer from many call sites
 * (welcomes, track of the day, Respect milestones, space recaps, the daily
 * digest) with no approval step. If one of those callers loops, nothing stops
 * it. This is the stop: at most N official casts per UTC day.
 *
 * DEFAULT OFF. The cap applies only when `FARCASTER_AUTOCAST_DAILY_CAP` is a
 * positive integer. Unset, empty, 0 or anything else means no cap and no
 * database read, so behaviour is unchanged until the flag is set.
 *
 * WHAT IT COUNTS. Rows in the existing `channel_casts` table for this channel
 * authored by `ZAO_OFFICIAL_FID` since 00:00 UTC. No new table. That table is
 * fed by the Neynar webhook, so the count can lag a post by a few seconds and
 * it includes official casts made by hand. Both push the cap toward posting
 * LESS, which is the safe direction for a runaway guard.
 *
 * FAILS CLOSED. With the cap on, a count that cannot be read (no official fid
 * configured, a query error) blocks the cast: a guard that waves posts through
 * when it cannot see is not a guard. With the cap off nothing can block.
 */
import { logger } from '@/lib/logger';

export type AutoCastCapDecision =
  | { allowed: true; capped: false }
  | { allowed: true; capped: true; used: number; cap: number }
  | { allowed: false; capped: true; reason: string; used?: number; cap: number };

/** The configured cap, or null when the flag is off. */
export function autoCastDailyCap(): number | null {
  const raw = process.env.FARCASTER_AUTOCAST_DAILY_CAP;
  if (!raw) return null;
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw.trim());
  return n > 0 ? n : null;
}

/** 00:00 UTC of the day containing `now`, as an ISO string. */
export function utcDayStart(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/** Counts today's official casts. Injected in tests; the default reads Supabase. */
export type OfficialCastCounter = (
  channelId: string,
  fid: number,
  sinceIso: string,
) => Promise<number>;

const supabaseCounter: OfficialCastCounter = async (channelId, fid, sinceIso) => {
  // Imported here, not at module load, so the flag-off path never touches the
  // database client.
  const { supabaseAdmin } = await import('@/lib/db/supabase');
  const { count, error } = await supabaseAdmin
    .from('channel_casts')
    .select('hash', { count: 'exact', head: true })
    .eq('channel_id', channelId)
    .eq('fid', fid)
    .gte('timestamp', sinceIso);
  if (error) throw new Error(error.message);
  if (typeof count !== 'number') throw new Error('count missing from response');
  return count;
};

/**
 * Decide whether one more official cast to `channelId` is allowed today.
 * Never throws.
 */
export async function checkAutoCastCap(
  channelId: string,
  opts: { now?: Date; counter?: OfficialCastCounter } = {},
): Promise<AutoCastCapDecision> {
  const cap = autoCastDailyCap();
  if (cap === null) return { allowed: true, capped: false };

  const fidRaw = process.env.ZAO_OFFICIAL_FID;
  const fid = fidRaw && /^\d+$/.test(fidRaw.trim()) ? Number(fidRaw.trim()) : null;
  if (fid === null) {
    logger.error('[auto-cast] daily cap is on but ZAO_OFFICIAL_FID is not set - blocking the cast');
    return { allowed: false, capped: true, reason: 'official fid not configured', cap };
  }

  try {
    const count = opts.counter ?? supabaseCounter;
    const used = await count(channelId, fid, utcDayStart(opts.now ?? new Date()));
    if (used >= cap) {
      logger.warn(
        `[auto-cast] daily cap reached for /${channelId}: ${used} of ${cap} - cast not sent`,
      );
      return { allowed: false, capped: true, reason: 'daily cap reached', used, cap };
    }
    return { allowed: true, capped: true, used, cap };
  } catch (err: unknown) {
    logger.error('[auto-cast] daily cap count failed - blocking the cast:', err);
    return { allowed: false, capped: true, reason: 'count failed', cap };
  }
}
