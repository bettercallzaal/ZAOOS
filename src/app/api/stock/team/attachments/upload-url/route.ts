import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const ENTITY_TYPES = ['sponsor', 'artist', 'timeline', 'note', 'volunteer'] as const;
const KINDS = ['deck', 'rider', 'contract', 'invoice', 'photo', 'other'] as const;

const MAX_BYTES = 25 * 1024 * 1024;
const BUCKET = 'stock-attachments';

const schema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
  kind: z.enum(KINDS).default('other'),
  filename: z.string().min(1).max(200),
  mime_type: z.string().min(1).max(200),
  size_bytes: z.number().int().min(1).max(MAX_BYTES),
});

function safeFilename(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function POST(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const token = randomBytes(12).toString('hex');
  const clean = safeFilename(parsed.data.filename);
  const storagePath = `${parsed.data.entity_type}/${parsed.data.entity_id}/${token}-${clean}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    logger.error({ error, storagePath }, 'stock attachments signed upload url failed');
    const msg = error?.message || 'Failed to create upload URL';
    const hint = /bucket/i.test(msg)
      ? ' Create private bucket `stock-attachments` in Supabase Storage first.'
      : '';
    return NextResponse.json({ error: `${msg}.${hint}` }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    maxBytes: MAX_BYTES,
  });
}
