import { NextResponse } from 'next/server';
import { getReaderSession, getSessionData } from '@/lib/auth/session';
import { openFrontDoorEnabled } from '@/lib/gates/front-door';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      // A visitor is not authenticated as a member; say so, so the login page
      // can send them to /feed instead of leaving them on the sign-in screen.
      const visitor = openFrontDoorEnabled() && (await getReaderSession())?.role === 'visitor';
      return NextResponse.json(
        visitor ? { authenticated: false, visitor: true } : { authenticated: false },
        { status: 401 },
      );
    }
    return NextResponse.json({ authenticated: true, ...session });
  } catch (err) {
    logger.error('Session read error:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
