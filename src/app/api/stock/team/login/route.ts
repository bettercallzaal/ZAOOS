import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scryptSync, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { saveStockTeamSession } from '@/lib/auth/stock-team-session';

const loginSchema = z.object({
  password: z.string().min(1).max(64),
});

function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const result = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (result.length !== expected.length) return false;
  return timingSafeEqual(result, expected);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const normalized = parsed.data.password.trim().toUpperCase();

    const supabase = getSupabaseAdmin();
    const { data: members, error } = await supabase
      .from('stock_team_members')
      .select('id, name, password_hash');

    if (error || !members) {
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }

    const match = members.find((m) => m.password_hash && verifyPassword(normalized, m.password_hash));

    if (!match) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    await saveStockTeamSession(match.id, match.name);
    return NextResponse.json({ success: true, name: match.name });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
