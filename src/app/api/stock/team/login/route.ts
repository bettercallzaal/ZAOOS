import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scryptSync } from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { saveStockTeamSession } from '@/lib/auth/stock-team-session';

const loginSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const result = scryptSync(password, salt, 64).toString('hex');
  return result === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Name and password required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: member, error } = await supabase
      .from('stock_team_members')
      .select('id, name, password_hash')
      .ilike('name', parsed.data.name)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!verifyPassword(parsed.data.password, member.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await saveStockTeamSession(member.id, member.name);
    return NextResponse.json({ success: true, name: member.name });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
