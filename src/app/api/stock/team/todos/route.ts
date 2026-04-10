import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = request.nextUrl.searchParams.get('owner');
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('stock_todos')
    .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
    .order('status')
    .order('created_at', { ascending: false });

  if (owner) {
    query = query.eq('owner_id', owner);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load todos' }, { status: 500 });

  return NextResponse.json({ todos: data });
}

const createSchema = z.object({
  title: z.string().min(1).max(500),
  owner_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_todos')
    .insert({
      title: parsed.data.title,
      owner_id: parsed.data.owner_id || null,
      created_by: member.memberId,
    })
    .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  return NextResponse.json({ todo: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  notes: z.string().max(2000).optional(),
  owner_id: z.string().uuid().nullable().optional(),
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
  const { error } = await supabase
    .from('stock_todos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  return NextResponse.json({ success: true });
}
