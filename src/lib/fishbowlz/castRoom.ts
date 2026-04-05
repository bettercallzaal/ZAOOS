import { postCast } from '@/lib/farcaster/neynar';
import { ENV } from '@/lib/env';

const FISHBOWLZ_CHANNEL = 'fishbowlz';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zaoos.com';

/**
 * Cast to Farcaster when a fishbowl room is created.
 * Fire-and-forget — errors are logged but never re-thrown.
 */
export async function castRoomCreated(room: {
  title: string;
  slug: string;
  host_username: string;
  hot_seat_count: number;
}) {
  if (!ENV.ZAO_OFFICIAL_SIGNER_UUID) return;

  const roomUrl = `${SITE_URL}/fishbowlz/${room.slug}`;
  const text = `🐟 New fishbowl: "${room.title}"\n\nHosted by @${room.host_username} · ${room.hot_seat_count} hot seats\n\nJoin the conversation 👇\n${roomUrl}`;

  try {
    await postCast(
      ENV.ZAO_OFFICIAL_SIGNER_UUID,
      text,
      FISHBOWLZ_CHANNEL,
      undefined,
      undefined,
      [roomUrl],
      undefined,
      ENV.ZAO_OFFICIAL_NEYNAR_API_KEY,
    );
  } catch (err) {
    console.error('[fishbowlz] Failed to cast room created:', err);
    // Non-critical — don't propagate
  }
}

/**
 * Cast to Farcaster when a fishbowl room ends with a summary.
 * Fire-and-forget — errors are logged but never re-thrown.
 */
export async function castRoomEnded(
  room: {
    title: string;
    slug: string;
    host_username: string;
    total_speakers: number;
  },
  transcriptCount: number,
) {
  if (!ENV.ZAO_OFFICIAL_SIGNER_UUID) return;

  const roomUrl = `${SITE_URL}/fishbowlz/${room.slug}`;
  const text = `🐟 Fishbowl ended: "${room.title}"\n\nHosted by @${room.host_username} · ${room.total_speakers} speakers · ${transcriptCount} transcript segments\n\nRead the transcript 👇\n${roomUrl}`;

  try {
    await postCast(
      ENV.ZAO_OFFICIAL_SIGNER_UUID,
      text,
      FISHBOWLZ_CHANNEL,
      undefined,
      undefined,
      [roomUrl],
      undefined,
      ENV.ZAO_OFFICIAL_NEYNAR_API_KEY,
    );
  } catch (err) {
    console.error('[fishbowlz] Failed to cast room ended:', err);
  }
}
