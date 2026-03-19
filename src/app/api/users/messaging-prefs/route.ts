import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

const DEFAULTS = { autoJoinGroup: true, allowNonZaoDms: false };

const patchSchema = z.object({
  autoJoinGroup: z.boolean().optional(),
  allowNonZaoDms: z.boolean().optional(),
});

/**
 * GET — return current messaging preferences (with defaults).
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('messaging_prefs')
    .eq('fid', session.fid)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[messaging-prefs] GET error:', error);
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }

  const prefs = { ...DEFAULTS, ...(data?.messaging_prefs ?? {}) };
  return NextResponse.json(prefs);
}

/**
 * PATCH — update one or more messaging preferences.
 */
export async function PATCH(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preferences', details: parsed.error.flatten() }, { status: 400 });
  }

  // Merge with existing prefs
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('messaging_prefs')
    .eq('fid', session.fid)
    .eq('is_active', true)
    .maybeSingle();

  const merged = { ...DEFAULTS, ...(existing?.messaging_prefs ?? {}), ...parsed.data };

  const { error } = await supabaseAdmin
    .from('users')
    .update({ messaging_prefs: merged })
    .eq('fid', session.fid);

  if (error) {
    console.error('[messaging-prefs] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }

  return NextResponse.json(merged);
}
