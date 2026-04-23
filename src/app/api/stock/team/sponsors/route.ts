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
    .from('stock_sponsors')
    .select('*, owner:stock_team_members!owner_id(id, name)')
    .order('track')
    .order('status')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load sponsors' }, { status: 500 });
  return NextResponse.json({ sponsors: data });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  track: z.enum(['local', 'virtual', 'ecosystem']),
  status: z.enum(['lead', 'contacted', 'in_talks', 'committed', 'paid', 'declined']).optional(),
  contact_name: z.string().max(200).optional(),
  contact_email: z.string().max(200).optional(),
  contact_phone: z.string().max(50).optional(),
  why_them: z.string().max(1000).optional(),
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
    .from('stock_sponsors')
    .insert(parsed.data)
    .select('*, owner:stock_team_members!owner_id(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'sponsor',
    entityId: data.id,
    action: 'create',
    newValue: { name: data.name, track: data.track, status: data.status },
  });
  return NextResponse.json({ sponsor: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  track: z.enum(['local', 'virtual', 'ecosystem']).optional(),
  status: z.enum(['lead', 'contacted', 'in_talks', 'committed', 'paid', 'declined']).optional(),
  contact_name: z.string().max(200).optional(),
  contact_email: z.string().max(200).optional(),
  contact_phone: z.string().max(50).optional(),
  amount_committed: z.number().min(0).optional(),
  amount_paid: z.number().min(0).optional(),
  why_them: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  owner_id: z.string().uuid().nullable().optional(),
  last_contacted_at: z.string().datetime().nullable().optional(),
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
    .from('stock_sponsors')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('stock_sponsors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update sponsor' }, { status: 500 });
  if (before) {
    await logFieldChanges(member.memberId, 'sponsor', id, before, updates);
  }
  return NextResponse.json({ success: true });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: before } = await supabase
    .from('stock_sponsors')
    .select('name, track, status')
    .eq('id', parsed.data.id)
    .maybeSingle();

  const { error } = await supabase.from('stock_sponsors').delete().eq('id', parsed.data.id);

  if (error) return NextResponse.json({ error: 'Failed to delete sponsor' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'sponsor',
    entityId: parsed.data.id,
    action: 'delete',
    oldValue: before ?? null,
  });
  return NextResponse.json({ success: true });
}
