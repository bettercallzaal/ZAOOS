import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData } from '@/types';

const ADMIN_FIDS = [19640];

export interface SessionPayload {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  signerUuid?: string | null;
  isAdmin?: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'zaoos_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionPayload>> {
  const cookieStore = await cookies();
  return getIronSession<SessionPayload>(cookieStore, sessionOptions);
}

export async function getSessionData(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.fid) return null;
  return {
    fid: session.fid,
    username: session.username || '',
    displayName: session.displayName || '',
    pfpUrl: session.pfpUrl || '',
    signerUuid: session.signerUuid || null,
    isAdmin: session.isAdmin || false,
  };
}

export async function saveSession(data: {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  signerUuid?: string | null;
}) {
  const session = await getSession();
  session.fid = data.fid;
  session.username = data.username;
  session.displayName = data.displayName;
  session.pfpUrl = data.pfpUrl;
  session.signerUuid = data.signerUuid || null;
  session.isAdmin = ADMIN_FIDS.includes(data.fid);
  await session.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}

export function isAdmin(fid: number): boolean {
  return ADMIN_FIDS.includes(fid);
}
