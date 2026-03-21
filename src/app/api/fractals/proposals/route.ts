// src/app/api/fractals/proposals/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

const ORNODE_URL = 'https://ornode2.frapps.xyz';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${ORNODE_URL}/proposals?limit=20`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ proposals: [], total: 0, source: 'unavailable' });
    }

    const data = await res.json();
    const proposals = Array.isArray(data) ? data : (data.proposals ?? []);

    return NextResponse.json({ proposals, total: proposals.length, source: 'ornode' });
  } catch {
    return NextResponse.json({ proposals: [], total: 0, source: 'unavailable' });
  }
}
