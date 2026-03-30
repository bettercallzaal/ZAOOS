import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  display_name: z.string().max(50).trim().optional(),
  bio: z.string().max(300).trim().optional(),
  ign: z.string().max(30).trim().optional(),
  real_name: z.string().max(80).trim().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'No fields to update' });

/**
 * GET — return ZAO-specific profile fields for the current user.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('display_name, bio, ign, real_name, bluesky_handle, lens_profile_id, hive_username, publishing_prefs')
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      display_name: data?.display_name || '',
      bio: data?.bio || '',
      ign: data?.ign || '',
      real_name: data?.real_name || '',
      bluesky_handle: data?.bluesky_handle || null,
      lens_profile_id: data?.lens_profile_id || null,
      hive_username: data?.hive_username || null,
      publishing_prefs: data?.publishing_prefs || null,
    });
  } catch (err) {
    logger.error('[users/profile] GET error:', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

/**
 * PATCH — update ZAO-specific profile fields.
 */
export async function PATCH(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('fid', session.fid)
      .eq('is_active', true)
      .select('display_name, bio, ign, real_name')
      .single();

    if (error) throw error;

    return NextResponse.json({
      display_name: data.display_name || '',
      bio: data.bio || '',
      ign: data.ign || '',
      real_name: data.real_name || '',
    });
  } catch (err) {
    logger.error('[users/profile] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
