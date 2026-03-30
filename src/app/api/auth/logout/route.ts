import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
