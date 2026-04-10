import { NextResponse } from 'next/server';
import { clearStockTeamSession } from '@/lib/auth/stock-team-session';

export async function POST() {
  await clearStockTeamSession();
  return NextResponse.json({ success: true });
}
