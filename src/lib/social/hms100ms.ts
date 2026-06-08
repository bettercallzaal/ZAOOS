import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

/**
 * Server-only helpers for the 100ms management REST API (active peer counts,
 * ghost-room cleanup). Kept separate from the token route so the room list and
 * the stale-room cron can share one minting + peer-count implementation.
 */

/** Mint a short-lived 100ms management token, or null when creds are absent. */
export function mintManagementToken(): string | null {
  const accessKey = process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
  const appSecret = process.env.HMS_APP_SECRET;
  if (!accessKey || !appSecret) return null;
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { access_key: accessKey, type: 'management', version: 2, iat: now, nbf: now },
    appSecret,
    { algorithm: 'HS256', expiresIn: '10m', jwtid: crypto.randomUUID() },
  );
}

/**
 * Live count of connected peers in a 100ms room.
 *
 * Returns `null` when the count can't be determined (missing creds / API error)
 * so callers fall back to a cached value and never act on bad data; returns `0`
 * when the room exists but has no active session (404 from active-rooms).
 *
 * Pass a shared `token` when checking many rooms in a loop to avoid re-minting.
 */
export async function get100msPeerCount(
  roomId100ms: string,
  token?: string | null,
): Promise<number | null> {
  const mgmt = token ?? mintManagementToken();
  if (!mgmt) return null;
  try {
    const res = await fetch(`https://api.100ms.live/v2/active-rooms/${roomId100ms}`, {
      headers: { Authorization: `Bearer ${mgmt}` },
    });
    if (res.status === 404) return 0; // room has no active session => empty
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data.peers === 'object' && data.peers !== null) {
      return Object.keys(data.peers).length;
    }
    if (typeof data?.peer_count === 'number') return data.peer_count;
    return 0;
  } catch (err) {
    logger.error('[hms100ms] peer count failed', err);
    return null;
  }
}
