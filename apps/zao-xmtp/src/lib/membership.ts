/**
 * Who is a member right now. The session cookie lasts 7 days, so Respect is
 * re-checked on a short interval instead of being trusted from sign-in.
 *
 * - Checked within RESPECT_RECHECK_MS: trust the session.
 * - Older: run the Respect check again.
 *   - member: refresh the timestamp.
 *   - not-member: the session is revoked.
 *   - unknown (hub or RPC down): keep the session only while the last definite
 *     check is younger than UNKNOWN_GRACE_MS, then refuse. An outage does not
 *     lock everyone out at once, and cannot extend access forever either.
 */

import type { IronSession } from 'iron-session';
import { hubUrl, optimismRpcUrl } from '@/lib/env';
import { getVerifiedEthAddresses } from '@/lib/hub';
import { checkRespect, optimismClient, type RespectCheck } from '@/lib/respect';
import { getSession, type SessionData } from '@/lib/session';

export const RESPECT_RECHECK_MS = 15 * 60 * 1000;
export const UNKNOWN_GRACE_MS = 24 * 60 * 60 * 1000;

export type MembershipDecision =
  | { action: 'allow'; refresh: boolean }
  | { action: 'deny'; revoke: boolean };

/** Pure decision, given when Respect was last confirmed and (if needed) a fresh check. */
export function decideMembership(
  lastCheckedAt: number | null,
  now: number,
  freshCheck: RespectCheck | null,
): MembershipDecision {
  if (lastCheckedAt === null) return { action: 'deny', revoke: true };
  if (now - lastCheckedAt < RESPECT_RECHECK_MS) return { action: 'allow', refresh: false };
  if (freshCheck === null) return { action: 'deny', revoke: false };
  if (freshCheck.status === 'member') return { action: 'allow', refresh: true };
  if (freshCheck.status === 'not-member') return { action: 'deny', revoke: true };
  return now - lastCheckedAt < UNKNOWN_GRACE_MS
    ? { action: 'allow', refresh: false }
    : { action: 'deny', revoke: false };
}

async function recheckRespect(session: SessionData): Promise<RespectCheck> {
  if (typeof session.fid !== 'number') return { status: 'not-member', checked: 0 };
  const verified = await getVerifiedEthAddresses(session.fid, { hubUrl: hubUrl() });
  if (verified === null) return { status: 'unknown', reason: 'hub unreadable' };
  const addresses = session.custody ? [session.custody, ...verified] : verified;
  return checkRespect(addresses, optimismClient(optimismRpcUrl()));
}

export type MemberSession = IronSession<SessionData> & { fid: number };

/**
 * The session, only if it belongs to a current Respect holder.
 *
 * `persist: true` in route handlers, which may write cookies. Server components
 * cannot set cookies, so pages pass `persist: false`: the check still runs and
 * still refuses a non-member, it just cannot store the refreshed time.
 */
export async function requireMember(opts: { persist: boolean }): Promise<MemberSession | null> {
  const session = await getSession();
  if (!session.isMember || typeof session.fid !== 'number') return null;

  const parsed = session.respectCheckedAt ? Date.parse(session.respectCheckedAt) : Number.NaN;
  const lastCheckedAt = Number.isNaN(parsed) ? null : parsed;
  const now = Date.now();

  let fresh: RespectCheck | null = null;
  if (lastCheckedAt !== null && now - lastCheckedAt >= RESPECT_RECHECK_MS) {
    try {
      fresh = await recheckRespect(session);
    } catch (error: unknown) {
      fresh = { status: 'unknown', reason: error instanceof Error ? error.message : 'recheck failed' };
    }
    if (fresh.status === 'unknown') {
      console.error(`[membership] Respect re-check unknown for fid ${session.fid}: ${fresh.reason}`);
    }
  }

  const decision = decideMembership(lastCheckedAt, now, fresh);
  if (decision.action === 'deny') {
    if (decision.revoke && opts.persist) session.destroy();
    return null;
  }
  if (decision.refresh && opts.persist) {
    session.respectCheckedAt = new Date(now).toISOString();
    await session.save();
  }
  return session as MemberSession;
}
