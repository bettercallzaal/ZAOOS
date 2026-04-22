import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  entity_type: z.enum(['sponsor', 'artist', 'timeline', 'todo', 'note', 'volunteer', 'budget', 'goal', 'member']),
  entity_id: z.string().uuid(),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export async function GET(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    entity_type: searchParams.get('entity_type'),
    entity_id: searchParams.get('entity_id'),
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_activity_log')
    .select('*, actor:stock_team_members!actor_id(id, name)')
    .eq('entity_type', parsed.data.entity_type)
    .eq('entity_id', parsed.data.entity_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (error) {
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
  return NextResponse.json({ activity: data });
}
