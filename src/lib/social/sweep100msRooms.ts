import { getActiveMSRooms, endMSRoom, setMSRoomParticipantCount } from '@/lib/social/msRoomsDb';
import { get100msPeerCount, mintManagementToken } from '@/lib/social/hms100ms';
import { logger } from '@/lib/logger';

/**
 * Ghost-room sweep for 100ms rooms — ends rooms still marked `active` after a
 * host left without hitting "Leave". 100ms is authoritative: a room is ended
 * only when the API reports 0 peers past a short grace; an unknown peer count
 * (missing creds / transient error) NEVER ends a room; never-joined rooms end
 * only after a long TTL.
 *
 * Extracted so it can run from the shared daily "stale rooms" cron without
 * needing its own vercel.json cron entry (the project's cron budget is full —
 * a dedicated schedule fails the deploy). Real-time cleanup still comes from the
 * 100ms webhook (session.close → endMSRoom); this is the backstop.
 */

const EMPTY_GRACE_MINUTES = 15; // empty + older than this => ghost
const UNRESOLVED_TTL_MINUTES = 360; // never joined (no room_id_100ms) => end after 6h

export interface Sweep100msResult {
  checked: number;
  ended: number;
  skipped: number;
  endedIds: string[];
}

export async function sweepStale100msRooms(): Promise<Sweep100msResult> {
  const rooms = await getActiveMSRooms();
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
      skipped += 1;
      continue;
    }

    try {
      await endMSRoom(room.id);
      endedIds.push(room.id);
    } catch (err) {
      logger.warn('[sweep100ms] end failed for ' + room.id, err);
    }
  }

  logger.info(
    `[sweep100ms] checked=${checked} ended=${endedIds.length} skipped=${skipped}`,
    { endedIds },
  );
  return { checked, ended: endedIds.length, skipped, endedIds };
}
