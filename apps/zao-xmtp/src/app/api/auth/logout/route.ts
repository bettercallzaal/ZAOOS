import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/** POST - end the session. */
export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[auth/logout]', error);
    return NextResponse.json({ error: 'Could not sign out' }, { status: 500 });
  }
}
