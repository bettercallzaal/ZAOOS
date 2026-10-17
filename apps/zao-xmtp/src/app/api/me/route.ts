import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/membership';

/** GET - the signed-in member, or `{ user: null }`. */
export async function GET() {
  try {
    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        fid: session.fid,
        username: session.username ?? null,
        displayName: session.displayName ?? null,
        pfpUrl: session.pfpUrl ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('[me]', error);
    return NextResponse.json({ error: 'Could not read session' }, { status: 500 });
  }
}
