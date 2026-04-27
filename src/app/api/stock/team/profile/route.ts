import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  bio: z.string().max(2000).optional(),
  links: z.string().max(500).optional(),
  photo_url: z
    .string()
    .max(500)
    .optional()
    .refine(
      (v) => !v || v === '' || /^https:\/\//i.test(v),
      { message: 'Photo URL must start with https://' },
    ),
  scope: z.enum(['', 'ops', 'music', 'design']).optional(),
  status_text: z.string().max(140).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getStockTeamMember();
    if (!session) {
      return NextResponse.json({ error: 'Not signed in. Log out and back in.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const firstMsg = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: firstMsg, details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates: Record<string, string> = {};
    if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
    if (parsed.data.links !== undefined) updates.links = parsed.data.links;
    if (parsed.data.photo_url !== undefined) updates.photo_url = parsed.data.photo_url;
    if (parsed.data.scope !== undefined) updates.scope = parsed.data.scope;
    if (parsed.data.status_text !== undefined) updates.status_text = parsed.data.status_text;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('stock_team_members')
      .update(updates)
      .eq('id', session.memberId)
      .select('id, name, bio, links, photo_url, status_text')
      .single();

    if (error) {
      logger.error({ error, memberId: session.memberId }, 'stock-team profile update failed');
      const dbMsg = error.message || 'Update failed';
      const hint = /column .* does not exist/i.test(dbMsg)
        ? ' The bio/links/photo_url columns are missing. Run scripts/stock-schema.sql in Supabase.'
        : '';
      return NextResponse.json({ error: `Update failed: ${dbMsg}${hint}` }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Update applied but no row returned' }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (err) {
    logger.error({ err }, 'stock-team profile update threw');
    const msg = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: `Profile update failed: ${msg}` }, { status: 500 });
  }
}
