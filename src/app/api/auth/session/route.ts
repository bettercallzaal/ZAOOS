import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, ...session });
  } catch (err) {
    logger.error('Session read error:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
