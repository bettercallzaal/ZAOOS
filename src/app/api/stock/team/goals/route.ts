import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_goals')
    .select('*')
    .order('sort_order');

  if (error) return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 });
  return NextResponse.json({ goals: data });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['locked', 'wip', 'tbd']).optional(),
  details: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('stock_goals').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });

  return NextResponse.json({ success: true });
}
