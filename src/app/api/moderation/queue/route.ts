import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/moderation/queue
 * Admin-only. Returns flagged items pending review.
 */
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('moderation_log')
      .select('*')
      .eq('action', 'flag')
      .is('reviewed_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('[moderation/queue] GET error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch moderation queue' },
        { status: 500 },
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    logger.error('[moderation/queue] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 },
    );
  }
}

const PatchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['allow', 'hide']),
});

/**
 * PATCH /api/moderation/queue
 * Admin-only. Review a flagged item — allow or hide it.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id, action } = parsed.data;

    // Update moderation log with review decision
    const newAction = action === 'hide' ? 'hide' : 'override';
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('moderation_log')
      .update({
        action: newAction,
        reviewed_by_fid: session.fid,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('cast_hash, fid')
      .single();

    if (updateError || !updated) {
      logger.error('[moderation/queue] PATCH update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update moderation log' },
        { status: 500 },
      );
    }

    // If hiding, insert into hidden_messages
    if (action === 'hide') {
      const { error: hideError } = await supabaseAdmin
        .from('hidden_messages')
        .upsert(
          {
            cast_hash: updated.cast_hash,
            hidden_by_fid: session.fid,
            reason: 'AI moderation — admin confirmed',
          },
          { onConflict: 'cast_hash' },
        );

      if (hideError) {
        logger.error('[moderation/queue] Hide insert error:', hideError);
        // Non-fatal: the review was recorded even if hide fails
      }
    }

    return NextResponse.json({ ok: true, action: newAction });
  } catch (err) {
    logger.error('[moderation/queue] PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 },
    );
  }
}
