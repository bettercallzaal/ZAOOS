import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logActivity, logFieldChanges } from '@/lib/stock/log-activity';

export async function GET() {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_volunteers')
    .select('*, recruited_by_member:stock_team_members!recruited_by(id, name)')
    .order('confirmed', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load volunteers' }, { status: 500 });
  return NextResponse.json({ volunteers: data });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  role: z.enum(['setup', 'checkin', 'water', 'safety', 'teardown', 'floater', 'content', 'unassigned']).optional(),
  shift: z.enum(['early', 'block1', 'block2', 'teardown', 'allday']).optional(),
  notes: z.string().max(1000).optional(),
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
    .from('stock_volunteers')
    .insert({ ...parsed.data, recruited_by: member.memberId })
    .select('*, recruited_by_member:stock_team_members!recruited_by(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create volunteer' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'volunteer',
    entityId: data.id,
    action: 'create',
    newValue: { name: data.name, role: data.role, shift: data.shift },
  });
  return NextResponse.json({ volunteer: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  role: z.enum(['setup', 'checkin', 'water', 'safety', 'teardown', 'floater', 'content', 'unassigned']).optional(),
  shift: z.enum(['early', 'block1', 'block2', 'teardown', 'allday']).optional(),
  confirmed: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
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
  const { data: before } = await supabase
    .from('stock_volunteers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('stock_volunteers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update volunteer' }, { status: 500 });
  if (before) {
    await logFieldChanges(member.memberId, 'volunteer', id, before, updates);
  }
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
  const { data: before } = await supabase
    .from('stock_volunteers')
    .select('name, role, shift')
    .eq('id', parsed.data.id)
    .maybeSingle();

  const { error } = await supabase.from('stock_volunteers').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to delete volunteer' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'volunteer',
    entityId: parsed.data.id,
    action: 'delete',
    oldValue: before ?? null,
  });
  return NextResponse.json({ success: true });
}
