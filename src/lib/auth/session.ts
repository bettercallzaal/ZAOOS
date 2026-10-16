import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { communityConfig } from '@/../community.config';
import { ENV } from '@/lib/env';
import type { SessionData } from '@/types';

const ADMIN_FIDS: readonly number[] = communityConfig.adminFids;
const ADMIN_WALLETS: readonly string[] = communityConfig.adminWallets;

export interface SessionPayload {
  fid?: number;
  walletAddress?: string;
  authMethod?: 'farcaster' | 'wallet';
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  signerUuid?: string | null;
  isAdmin?: boolean;
  /**
   * false = a VISITOR: a verified Farcaster account that is not a ZAO member,
   * let in by the open front door (src/lib/gates/front-door.ts). Absent = member:
   * every session created before this field existed came through an allowlist
   * gate (verify, siwe, miniapp/auth-context all call checkAllowlist).
   */
  isMember?: boolean;
}

/** A session that may only READ: members and visitors both qualify. */
export interface ReaderSession {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  role: 'member' | 'visitor';
}

/** True unless the session was explicitly created as a visitor. */
export function isMemberSession(session: { isMember?: boolean }): boolean {
  return session.isMember !== false;
}

// SameSite=None is REQUIRED for the session cookie to be sent in third-party
// iframe contexts — Farcaster client embeds zaoos.com in an iframe, and
// SameSite=Lax cookies are dropped on cross-site iframe navigations. Without
// None, /api/miniapp/auth-context sets a cookie that the browser then
// refuses to send on the /home redirect, and the server sees no session.
// SameSite=None requires Secure=true, so dev (http://localhost) keeps Lax.
const isProd = process.env.NODE_ENV === 'production';
const sessionOptions = {
  password: ENV.SESSION_SECRET,
  cookieName: 'zaoos_session',
  cookieOptions: {
    secure: isProd,
    httpOnly: true,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionPayload>> {
  const cookieStore = await cookies();
  return getIronSession<SessionPayload>(cookieStore, sessionOptions);
}

export const getSessionData = cache(async (): Promise<SessionData | null> => {
  const session = await getSession();
  // Valid session: has either FID or wallet address
  if (!session.fid && !session.walletAddress) return null;
  // Visitors are NOT members. Returning null here keeps every route that calls
  // getSessionData() members-only without touching it; visitor reads go through
  // getReaderSession() on the few routes that opt in.
  if (!isMemberSession(session)) return null;
  return {
    fid: session.fid || 0,
    walletAddress: session.walletAddress || null,
    authMethod: session.authMethod || 'farcaster',
    username: session.username || '',
    displayName: session.displayName || '',
    pfpUrl: session.pfpUrl || '',
    signerUuid: session.signerUuid || null,
    isAdmin: session.isAdmin || false,
  };
});

export async function saveSession(
  data: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    walletAddress?: string;
    authMethod?: 'farcaster' | 'wallet';
    signerUuid?: string | null;
  },
  opts: { allowAdmin?: boolean } = {},
) {
  // allowAdmin defaults true. Callers that authenticate via an UNSIGNED claim
  // (e.g. /api/miniapp/auth-context, which trusts a client-supplied FID) MUST
  // pass allowAdmin:false — otherwise POSTing a known admin FID would mint an
  // admin session (the public admin FID is in community.config.ts). Admin must
  // only ever come from a signature/JWT-verified path.
  const allowAdmin = opts.allowAdmin !== false;
  const session = await getSession();
  session.fid = data.fid;
  session.walletAddress = data.walletAddress || undefined;
  session.authMethod = data.authMethod || 'farcaster';
  session.username = data.username;
  session.displayName = data.displayName;
  session.pfpUrl = data.pfpUrl;
  session.signerUuid = data.signerUuid || null;
  session.isMember = true;
  session.isAdmin =
    allowAdmin &&
    (ADMIN_FIDS.includes(data.fid) ||
      (data.walletAddress ? ADMIN_WALLETS.includes(data.walletAddress.toLowerCase()) : false));
  await session.save();
}

export async function saveWalletSession(data: {
  walletAddress: string;
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}) {
  const session = await getSession();
  session.walletAddress = data.walletAddress.toLowerCase();
  session.authMethod = 'wallet';
  session.fid = data.fid || 0;
  session.username = data.username || '';
  session.displayName =
    data.displayName || data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4);
  session.pfpUrl = data.pfpUrl || '';
  session.signerUuid = null;
  session.isMember = true;
  session.isAdmin =
    (data.fid ? ADMIN_FIDS.includes(data.fid) : false) ||
    ADMIN_WALLETS.includes(data.walletAddress.toLowerCase());
  await session.save();
}

/**
 * A verified Farcaster account that is not on the allowlist. Never admin, never
 * a signer, no wallet: it can read, and nothing else.
 */
export async function saveVisitorSession(data: {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}): Promise<void> {
  const session = await getSession();
  session.fid = data.fid;
  session.username = data.username;
  session.displayName = data.displayName;
  session.pfpUrl = data.pfpUrl;
  session.authMethod = 'farcaster';
  session.walletAddress = undefined;
  session.signerUuid = null;
  session.isAdmin = false;
  session.isMember = false;
  await session.save();
}

/**
 * For read-only routes that visitors may use. A visitor session counts only
 * while the open front door is on, so turning the flag off shuts visitors out
 * of every route at once.
 */
export async function getReaderSession(): Promise<ReaderSession | null> {
  const session = await getSession();
  if (!session.fid) return null;
  const member = isMemberSession(session);
  if (!member) {
    const { openFrontDoorEnabled } = await import('@/lib/gates/front-door');
    if (!openFrontDoorEnabled()) return null;
  }
  return {
    fid: session.fid,
    username: session.username || '',
    displayName: session.displayName || '',
    pfpUrl: session.pfpUrl || '',
    role: member ? 'member' : 'visitor',
  };
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}

export function isAdmin(fid: number): boolean {
  return ADMIN_FIDS.includes(fid);
}
