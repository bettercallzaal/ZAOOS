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
    .from('stock_artists')
    .select('*, outreach:stock_team_members!outreach_by(id, name)')
    .order('status')
    .order('set_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load artists' }, { status: 500 });
  return NextResponse.json({ artists: data });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  genre: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  status: z.enum(['wishlist', 'contacted', 'interested', 'confirmed', 'declined', 'travel_booked']).optional(),
  socials: z.string().max(500).optional(),
  travel_from: z.string().max(200).optional(),
  needs_travel: z.boolean().optional(),
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
    .from('stock_artists')
    .insert(parsed.data)
    .select('*, outreach:stock_team_members!outreach_by(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create artist' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'artist',
    entityId: data.id,
    action: 'create',
    newValue: { name: data.name, status: data.status },
  });
  return NextResponse.json({ artist: data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  genre: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  status: z.enum(['wishlist', 'contacted', 'interested', 'confirmed', 'declined', 'travel_booked']).optional(),
  socials: z.string().max(500).optional(),
  travel_from: z.string().max(200).optional(),
  needs_travel: z.boolean().optional(),
  set_time_minutes: z.number().int().min(0).max(180).optional(),
  set_order: z.number().int().min(0).nullable().optional(),
  fee: z.number().min(0).optional(),
  rider: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  outreach_by: z.string().uuid().nullable().optional(),
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
    .from('stock_artists')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('stock_artists')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 });
  if (before) {
    await logFieldChanges(member.memberId, 'artist', id, before, updates);
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
    .from('stock_artists')
    .select('name, status')
    .eq('id', parsed.data.id)
    .maybeSingle();

  const { error } = await supabase.from('stock_artists').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to delete artist' }, { status: 500 });
  await logActivity({
    actorId: member.memberId,
    entityType: 'artist',
    entityId: parsed.data.id,
    action: 'delete',
    oldValue: before ?? null,
  });
  return NextResponse.json({ success: true });
}
