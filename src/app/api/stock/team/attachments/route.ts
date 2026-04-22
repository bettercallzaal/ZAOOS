import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logActivity } from '@/lib/stock/log-activity';
import { logger } from '@/lib/logger';

const ENTITY_TYPES = ['sponsor', 'artist', 'timeline', 'note', 'volunteer'] as const;
const KINDS = ['deck', 'rider', 'contract', 'invoice', 'photo', 'other'] as const;
const BUCKET = 'stock-attachments';
const DOWNLOAD_TTL_SECONDS = 60 * 10;

const listSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = listSchema.safeParse({
    entity_type: searchParams.get('entity_type'),
    entity_id: searchParams.get('entity_id'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.issues }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_attachments')
    .select('*, uploaded_by_member:stock_team_members!uploaded_by(id, name)')
    .eq('entity_type', parsed.data.entity_type)
    .eq('entity_id', parsed.data.entity_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to load attachments' }, { status: 500 });

  const attachments = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, DOWNLOAD_TTL_SECONDS);
      return { ...row, download_url: signed?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ attachments });
}

const createSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
  kind: z.enum(KINDS).default('other'),
  filename: z.string().min(1).max(200),
  storage_path: z.string().min(1).max(500),
  mime_type: z.string().min(1).max(200),
  size_bytes: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const expectedPrefix = `${parsed.data.entity_type}/${parsed.data.entity_id}/`;
  if (!parsed.data.storage_path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: 'storage_path does not match entity' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_attachments')
    .insert({
      entity_type: parsed.data.entity_type,
      entity_id: parsed.data.entity_id,
      kind: parsed.data.kind,
      filename: parsed.data.filename,
      storage_path: parsed.data.storage_path,
      mime_type: parsed.data.mime_type,
      size_bytes: parsed.data.size_bytes,
      uploaded_by: member.memberId,
    })
    .select('*, uploaded_by_member:stock_team_members!uploaded_by(id, name)')
    .single();

  if (error) {
    logger.error({ error }, 'stock attachments insert failed');
    return NextResponse.json({ error: 'Failed to record attachment' }, { status: 500 });
  }

  await logActivity({
    actorId: member.memberId,
    entityType: parsed.data.entity_type,
    entityId: parsed.data.entity_id,
    action: 'attachment_add',
    newValue: `${parsed.data.kind}: ${parsed.data.filename}`,
  });

  return NextResponse.json({ attachment: data }, { status: 201 });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: row, error: fetchErr } = await supabase
    .from('stock_attachments')
    .select('*')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
  if (storageErr) {
    logger.warn({ storageErr, path: row.storage_path }, 'stock attachments storage remove failed');
  }

  const { error } = await supabase.from('stock_attachments').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });

  await logActivity({
    actorId: member.memberId,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: 'attachment_delete',
    oldValue: `${row.kind}: ${row.filename}`,
  });

  return NextResponse.json({ success: true });
}
