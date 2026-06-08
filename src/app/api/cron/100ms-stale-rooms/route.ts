import { NextRequest, NextResponse } from 'next/server';
import { getActiveMSRooms, endMSRoom, setMSRoomParticipantCount } from '@/lib/social/msRoomsDb';
import { get100msPeerCount, mintManagementToken } from '@/lib/social/hms100ms';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/100ms-stale-rooms
 *
 * Ends ghost ms_rooms — rooms still marked `active` after a host closed their
 * tab without hitting "Leave". Leaving a 100ms room doesn't end the ms_rooms
 * row (only a host PATCH does), so without this sweep dead rooms linger on
 * /spaces forever.
 *
 * 100ms is the authoritative signal here (unlike the Juke cron, which leans on
 * a webhook timeline): a room reporting zero connected peers that's older than
 * a short grace window is dead, so we flip it to ended.
 *
 * Conservative by design:
 *  - A room is ended only when 100ms explicitly reports 0 peers. An unknown
 *    count (null — missing creds or a transient API error) NEVER ends a room.
 *  - A non-empty room refreshes its cached participant_count and is left alone.
 *  - Rooms whose 100ms id was never resolved (nobody ever joined) are ended
 *    only after a long TTL, so a freshly-created room isn't reaped immediately.
 *
 * Idempotent: endMSRoom is a no-op flip on an already-ended row.
 *
 * Auth: Bearer CRON_SECRET (Vercel cron header). Registered in vercel.json.
 */

const EMPTY_GRACE_MINUTES = 15; // empty + older than this => ghost
const UNRESOLVED_TTL_MINUTES = 360; // never joined (no room_id_100ms) => end after 6h

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let rooms;
  try {
    rooms = await getActiveMSRooms();
  } catch (err) {
    logger.error('[cron/100ms-stale-rooms] list failed', err);
    return NextResponse.json({ ok: false, error: 'List failed' }, { status: 500 });
  }

  const now = Date.now();
  const mgmt = mintManagementToken();
  const endedIds: string[] = [];
  let checked = 0;
  let skipped = 0;

  for (const room of rooms) {
    checked += 1;
    const ageMin = (now - new Date(room.created_at).getTime()) / 60000;

    if (room.room_id_100ms && mgmt) {
      const count = await get100msPeerCount(room.room_id_100ms, mgmt);
      if (count === null) {
        skipped += 1; // unknown — never end on a bad/empty read
        continue;
      }
      if (count > 0) {
        if (count !== room.participant_count) {
          setMSRoomParticipantCount(room.id, count).catch(() => {});
        }
        skipped += 1;
        continue;
      }
      // count === 0 — only a ghost once past the grace window
      if (ageMin < EMPTY_GRACE_MINUTES) {
        skipped += 1;
        continue;
      }
    } else if (ageMin < UNRESOLVED_TTL_MINUTES) {
      // No resolved 100ms id (room was never joined) — give it a long TTL.
      skipped += 1;
      continue;
    }

    try {
      await endMSRoom(room.id);
      endedIds.push(room.id);
    } catch (err) {
      logger.warn('[cron/100ms-stale-rooms] end failed for ' + room.id, err);
    }
  }

  logger.info(
    `[cron/100ms-stale-rooms] checked=${checked} ended=${endedIds.length} skipped=${skipped}`,
    { endedIds },
  );
  return NextResponse.json({ ok: true, checked, ended: endedIds.length, skipped, ended_ids: endedIds });
}
