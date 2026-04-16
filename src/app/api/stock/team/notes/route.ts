import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_meeting_notes')
    .select('*, creator:stock_team_members!created_by(id, name)')
    .order('meeting_date', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 });
  return NextResponse.json({ notes: data });
}

const createSchema = z.object({
  meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(200),
  attendees: z.array(z.string()).optional(),
  notes: z.string().max(10000).optional(),
  action_items: z.string().max(5000).optional(),
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
    .from('stock_meeting_notes')
    .insert({ ...parsed.data, created_by: member.memberId })
    .select('*, creator:stock_team_members!created_by(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().min(1).max(200).optional(),
  attendees: z.array(z.string()).optional(),
  notes: z.string().max(10000).optional(),
  action_items: z.string().max(5000).optional(),
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
    .from('stock_meeting_notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  return NextResponse.json({ success: true });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('stock_meeting_notes').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  return NextResponse.json({ success: true });
}
