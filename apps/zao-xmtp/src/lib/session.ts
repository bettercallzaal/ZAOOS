import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionSecret } from '@/lib/env';

export interface SessionData {
  /** Set by /api/auth/nonce. Must match the nonce in the signed message. */
  nonce?: string;
  fid?: number;
  /** Farcaster custody address, re-checked for Respect with the verified addresses. */
  custody?: string;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  /** True only after a successful Respect check. */
  isMember?: boolean;
  /** Last time a Respect check was attempted and gave a definite answer. */
  respectCheckedAt?: string;
}

/** The cookie lives 7 days; Respect is re-checked far more often (see membership.ts). */
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
