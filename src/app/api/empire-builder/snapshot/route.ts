import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getZabalSnapshot } from '@/lib/empire-builder/client';
import { DEFAULT_TTL_MS, withCache } from '@/lib/empire-builder/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.fid) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const snapshot = await withCache('eb:zabal:snapshot', DEFAULT_TTL_MS, () => getZabalSnapshot());
    return NextResponse.json({ success: true, data: snapshot });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Empire Builder fetch failed';
    console.error('[empire-builder] snapshot error', message);
    return NextResponse.json({ success: false, error: 'snapshot_unavailable' }, { status: 502 });
  }
}
