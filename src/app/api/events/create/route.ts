import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * POST /api/events/create - the source-of-truth writer for ZAO events.
 *
 * Admin-only. Turns "edit the SQL migration" into "make an event". The `events`
 * table is the canonical registry (doc 2099); the Unlock collectible + Google
 * Calendar + lu.ma surfaces are projections of a row created here. lock_address /
 * unlock_event_url are optional at create time - paste them after creating the
 * lock on events.unlock-protocol.com (v1), or a later factory-deploy fills them.
 */
const createEventSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
  ends_at: z.string().datetime({ offset: true }).optional(),
  location: z.string().max(500).optional(),
  lock_address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'lock_address must be a 0x EVM address')
    .optional(),
  unlock_event_url: z.string().url().max(1000).optional(),
  chain_id: z.number().int().positive().default(8453),
  is_published: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    // slug is unique - reject a collision with a clear status, not a raw DB error.
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('slug', parsed.data.slug)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: 'An event with that slug already exists' },
        { status: 409 },
      );
    }

    const { data, error: insertError } = await supabase
      .from('events')
      .insert(parsed.data)
      .select('id, slug, title, is_published')
      .single();

    if (insertError) {
      logger.error('[events/create] insert failed:', insertError);
      return NextResponse.json(
        { ok: false, error: 'Could not create the event, please try again' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, event: data }, { status: 201 });
  } catch (error: unknown) {
    logger.error('[events/create] unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not create the event, please try again' },
      { status: 500 },
    );
  }
}
