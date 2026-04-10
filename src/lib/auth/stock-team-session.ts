import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { ENV } from '@/lib/env';

export interface StockTeamPayload {
  memberId?: string;
  memberName?: string;
}

const stockTeamSessionOptions = {
  password: ENV.SESSION_SECRET,
  cookieName: 'stock_team_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export async function getStockTeamSession(): Promise<IronSession<StockTeamPayload>> {
  const cookieStore = await cookies();
  return getIronSession<StockTeamPayload>(cookieStore, stockTeamSessionOptions);
}

export async function getStockTeamMember(): Promise<{ memberId: string; memberName: string } | null> {
  const session = await getStockTeamSession();
  if (!session.memberId || !session.memberName) return null;
  return { memberId: session.memberId, memberName: session.memberName };
}

export async function saveStockTeamSession(memberId: string, memberName: string) {
  const session = await getStockTeamSession();
  session.memberId = memberId;
  session.memberName = memberName;
  await session.save();
}

export async function clearStockTeamSession() {
  const session = await getStockTeamSession();
  session.destroy();
}
