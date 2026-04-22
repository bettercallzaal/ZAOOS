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
    .from('stock_budget_entries')
    .select('*, related_sponsor:stock_sponsors!related_sponsor_id(id, name)')
    .order('type')
    .order('category')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load budget' }, { status: 500 });
  return NextResponse.json({ entries: data });
}

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  status: z.enum(['projected', 'committed', 'actual']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  related_sponsor_id: z.string().uuid().nullable().optional(),
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
    .from('stock_budget_entries')
    .insert(parsed.data)
    .select('*, related_sponsor:stock_sponsors!related_sponsor_id(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'budget',
    entityId: data.id,
    action: 'create',
    newValue: { type: data.type, category: data.category, amount: data.amount },
  });
  return NextResponse.json({ entry: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().min(0).optional(),
  status: z.enum(['projected', 'committed', 'actual']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
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
    .from('stock_budget_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('stock_budget_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  if (before) {
    await logFieldChanges(member.memberId, 'budget', id, before, updates);
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
    .from('stock_budget_entries')
    .select('type, category, description, amount')
    .eq('id', parsed.data.id)
    .maybeSingle();

  const { error } = await supabase.from('stock_budget_entries').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'budget',
    entityId: parsed.data.id,
    action: 'delete',
    oldValue: before ?? null,
  });
  return NextResponse.json({ success: true });
}
