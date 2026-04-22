import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logActivity } from '@/lib/stock/log-activity';

const CHANNELS = ['email', 'call', 'sms', 'dm_farcaster', 'dm_x', 'dm_tg', 'in_person', 'other'] as const;
const DIRECTIONS = ['outbound', 'inbound'] as const;
const ENTITY_TYPES = ['sponsor', 'artist'] as const;

const querySchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    entity_type: searchParams.get('entity_type'),
    entity_id: searchParams.get('entity_id'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_contact_log')
    .select('*, contacted_by_member:stock_team_members!contacted_by(id, name)')
    .eq('entity_type', parsed.data.entity_type)
    .eq('entity_id', parsed.data.entity_id)
    .order('contacted_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load contact log' }, { status: 500 });
  return NextResponse.json({ entries: data });
}

const createSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
  channel: z.enum(CHANNELS),
  direction: z.enum(DIRECTIONS),
  summary: z.string().min(1).max(2000),
  contacted_at: z.string().datetime().optional(),
  next_action: z.string().max(500).optional(),
  next_action_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
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
    .from('stock_contact_log')
    .insert({
      entity_type: parsed.data.entity_type,
      entity_id: parsed.data.entity_id,
      channel: parsed.data.channel,
      direction: parsed.data.direction,
      summary: parsed.data.summary,
      contacted_at: parsed.data.contacted_at ?? new Date().toISOString(),
      contacted_by: member.memberId,
      next_action: parsed.data.next_action ?? '',
      next_action_at: parsed.data.next_action_at ?? null,
    })
    .select('*, contacted_by_member:stock_team_members!contacted_by(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to log contact' }, { status: 500 });

  await logActivity({
    actorId: member.memberId,
    entityType: parsed.data.entity_type,
    entityId: parsed.data.entity_id,
    action: 'contact_log',
    newValue: `${parsed.data.direction} ${parsed.data.channel}: ${parsed.data.summary.slice(0, 200)}`,
  });

  return NextResponse.json({ entry: data }, { status: 201 });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('stock_contact_log')
    .delete()
    .eq('id', parsed.data.id)
    .eq('contacted_by', member.memberId);

  if (error) return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  return NextResponse.json({ success: true });
}
