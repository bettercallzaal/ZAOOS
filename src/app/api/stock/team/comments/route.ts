import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logActivity } from '@/lib/stock/log-activity';

const ENTITY_TYPES = ['sponsor', 'artist', 'timeline', 'todo', 'note', 'volunteer', 'budget'] as const;

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
    .from('stock_comments')
    .select('*, author:stock_team_members!author_id(id, name)')
    .eq('entity_type', parsed.data.entity_type)
    .eq('entity_id', parsed.data.entity_id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  return NextResponse.json({ comments: data });
}

const createSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
  mentions: z.array(z.string().uuid()).max(20).optional(),
  parent_id: z.string().uuid().nullable().optional(),
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
    .from('stock_comments')
    .insert({
      entity_type: parsed.data.entity_type,
      entity_id: parsed.data.entity_id,
      author_id: member.memberId,
      body: parsed.data.body,
      mentions: parsed.data.mentions ?? [],
      parent_id: parsed.data.parent_id ?? null,
    })
    .select('*, author:stock_team_members!author_id(id, name)')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });

  await logActivity({
    actorId: member.memberId,
    entityType: parsed.data.entity_type,
    entityId: parsed.data.entity_id,
    action: 'comment',
    newValue: parsed.data.body.slice(0, 200),
  });

  return NextResponse.json({ comment: data }, { status: 201 });
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
    .from('stock_comments')
    .delete()
    .eq('id', parsed.data.id)
    .eq('author_id', member.memberId);

  if (error) return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  return NextResponse.json({ success: true });
}
