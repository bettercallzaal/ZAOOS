import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getRandomStat } from '@/lib/wavewarz/random-stats';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stat = await getRandomStat();
  if (!stat) {
    return NextResponse.json({ error: 'No stats available yet' }, { status: 404 });
  }

  return NextResponse.json(stat);
}
