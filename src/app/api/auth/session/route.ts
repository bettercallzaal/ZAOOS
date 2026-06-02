import { NextResponse } from 'next/server';
import { getSessionData, toPublicSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    // Never ship the managed-signer credential to the browser — clients read
    // `hasSigner` instead.
    return NextResponse.json({ authenticated: true, ...toPublicSession(session) });
  } catch (err) {
    logger.error('Session read error:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
