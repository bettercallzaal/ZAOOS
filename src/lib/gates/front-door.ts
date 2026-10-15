/**
 * The open front door (gate decision 2026-10-15):
 * any verified Farcaster account may sign in and READ the ZAO channel feeds as
 * a visitor. Posting into ZAO channels and every member feature stay
 * members-only, enforced server-side by getSessionData() returning null for
 * visitor sessions.
 *
 * DEFAULT OFF. On only when FARCASTER_OPEN_FRONT_DOOR is exactly `1`. Server
 * only: no NEXT_PUBLIC_, so flipping it needs no rebuild of client bundles.
 */
export function openFrontDoorEnabled(): boolean {
  return process.env.FARCASTER_OPEN_FRONT_DOOR === '1';
}

/** Reads a visitor may make per minute on top of the per-IP middleware limit. */
export const VISITOR_READS_PER_MINUTE = 20;
