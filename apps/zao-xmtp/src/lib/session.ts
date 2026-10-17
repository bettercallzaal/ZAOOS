import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionSecret } from '@/lib/env';

export interface SessionData {
  /** Set by /api/auth/nonce, consumed by /api/auth/verify. */
  nonce?: string;
  fid?: number;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  /** True only after a successful Respect check. */
  isMember?: boolean;
  respectCheckedAt?: string;
}

/** Re-check Respect when the session expires: 7 days. */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), {
    password: sessionSecret(),
    cookieName: 'zao-xmtp-session',
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  });
}

/** The session, only if it belongs to a Respect holder. */
export async function getMemberSession(): Promise<(IronSession<SessionData> & { fid: number }) | null> {
  const session = await getSession();
  if (!session.isMember || typeof session.fid !== 'number') return null;
  return session as IronSession<SessionData> & { fid: number };
}
