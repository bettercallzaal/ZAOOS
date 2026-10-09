/**
 * A fresh signer check before every Farcaster write.
 *
 * DreamNet Phase 1, Brandon's contract decision 2 (2026-10-09): "start with a
 * fresh server-side signer check on every write ... A cookie is identity/
 * session continuity, not signer authority."
 *
 * BEFORE: every write route trusted `session.signerUuid` from the iron-session
 * cookie. The signer was checked once, when it was saved
 * (`/api/auth/signer/save`), and never again, so a signer revoked on
 * Farcaster kept posting through ZAO OS until the cookie expired.
 *
 * NOW, with the flag on, each write asks Neynar for the signer's current
 * status first, and:
 * - allows it only if the status is `approved`, the signer's FID is the
 *   session's FID, and its permissions (when Neynar returns them) cover the
 *   action;
 * - on a DEFINITIVE rejection (revoked, not approved, wrong FID, missing
 *   permission) refuses with 403 and clears this session's signer binding, so
 *   the user re-approves;
 * - on anything else (timeout, 5xx, rate limit, malformed answer) refuses
 *   with 503 and KEEPS the binding. A timeout is not proof of revocation.
 *
 * Revoked signers also go into an in-process barrier, so a second write in the
 * same server instance is refused without waiting on Neynar. It lives only as
 * long as that instance; the per-write check is what holds across instances.
 *
 * Scheduled casts are covered at EXECUTION: `PATCH /api/chat/schedule` runs
 * this check before posting anything that is due.
 *
 * Neynar's signer object has no expiry field, so there is no expiry check.
 * Whether Neynar returns `permissions` for signers created through our app is
 * UNVERIFIED; when the field is absent the action is allowed on status and FID
 * alone, and that is the first thing to confirm before switching this on.
 *
 * DEFAULT OFF. Runs only when `FARCASTER_WRITE_SIGNER_CHECK` is exactly `1`.
 * The Neynar client and the session store are imported only when the flag is
 * on, so with it off a route loads nothing it did not load before.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export function writeSignerCheckEnabled(): boolean {
  return process.env.FARCASTER_WRITE_SIGNER_CHECK === '1';
}

export type WriteAction = 'cast' | 'delete-cast' | 'reaction' | 'delete-reaction' | 'other';

/** Neynar SharedSignerPermission values that allow each action, besides WRITE_ALL. */
const ACTION_PERMISSION: Record<WriteAction, string | null> = {
  cast: 'PUBLISH_CAST',
  'delete-cast': 'DELETE_CAST',
  reaction: 'PUBLISH_REACTION',
  'delete-reaction': 'DELETE_REACTION',
  other: null,
};

// Shape from docs.neynar.com/reference/lookup-signer (Signer schema), fetched 2026-10-09.
const neynarSignerSchema = z
  .object({
    signer_uuid: z.string(),
    status: z.enum(['generated', 'pending_approval', 'approved', 'revoked']),
    fid: z.number().int().optional(),
    permissions: z.array(z.string()).optional(),
  })
  .passthrough();

export type WriteAuthority =
  | { ok: true }
  | { ok: false; definitive: true; reason: string }
  | { ok: false; definitive: false; reason: string };

const revokedHere = new Set<string>();

/** Test hook: the barrier is process-local state. */
export function resetWriteBarrierForTests(): void {
  revokedHere.clear();
}

/** Never throws. */
export async function checkWriteAuthority(
  signerUuid: string,
  sessionFid: number,
  action: WriteAction,
  lookup: (uuid: string) => Promise<unknown> = async (uuid) =>
    (await import('@/lib/farcaster/neynar')).getSignerStatus(uuid),
): Promise<WriteAuthority> {
  if (revokedHere.has(signerUuid))
    return { ok: false, definitive: true, reason: 'revoked-earlier' };

  let raw: unknown;
  try {
    raw = await lookup(signerUuid);
  } catch (err: unknown) {
    return {
      ok: false,
      definitive: false,
      reason: `lookup-failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  const parsed = neynarSignerSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, definitive: false, reason: 'malformed-provider-response' };
  const signer = parsed.data;

  if (signer.signer_uuid !== signerUuid)
    return { ok: false, definitive: false, reason: 'provider-answered-for-another-signer' };
  if (signer.status === 'revoked') {
    revokedHere.add(signerUuid);
    return { ok: false, definitive: true, reason: 'revoked' };
  }
  if (signer.status !== 'approved')
    return { ok: false, definitive: true, reason: `status-${signer.status}` };
  if (signer.fid !== sessionFid) return { ok: false, definitive: true, reason: 'fid-mismatch' };
  if (signer.permissions) {
    const needed = ACTION_PERMISSION[action];
    const allowed =
      signer.permissions.includes('WRITE_ALL') ||
      (needed !== null && signer.permissions.includes(needed));
    if (!allowed)
      return { ok: false, definitive: true, reason: `missing-permission-for-${action}` };
  }
  return { ok: true };
}

/**
 * For write routes: null means go ahead. Otherwise returns the response to
 * send. Does nothing, and makes no call, while the flag is off.
 */
export async function guardSignerWrite(
  session: { fid: number; signerUuid?: string | null },
  action: WriteAction,
  lookup?: (uuid: string) => Promise<unknown>,
): Promise<NextResponse | null> {
  if (!writeSignerCheckEnabled()) return null;
  if (!session.signerUuid)
    return NextResponse.json({ error: 'No signer configured' }, { status: 401 });

  const result = await checkWriteAuthority(session.signerUuid, session.fid, action, lookup);
  if (result.ok) return null;

  if (result.definitive) {
    logger.warn(
      `[write-authority] fid ${session.fid} signer refused (${result.reason}); binding cleared`,
    );
    try {
      const { getSession } = await import('@/lib/auth/session');
      const live = await getSession();
      live.signerUuid = null;
      await live.save();
    } catch (err: unknown) {
      logger.error('[write-authority] could not clear the signer binding:', err);
    }
    return NextResponse.json(
      { error: 'Your signer is no longer authorized. Please approve a signer again.' },
      { status: 403 },
    );
  }

  logger.warn(
    `[write-authority] fid ${session.fid} signer check unavailable (${result.reason}); write refused`,
  );
  return NextResponse.json(
    { error: 'Could not confirm your signer right now. Please try again.' },
    { status: 503 },
  );
}
