import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  x_handle: z.string().max(50).trim().optional().nullable(),
  instagram_handle: z.string().max(50).trim().optional().nullable(),
  soundcloud_url: z.string().url().max(200).optional().nullable()
    .or(z.literal('').transform(() => null)),
  spotify_url: z.string().url().max(200).optional().nullable()
    .or(z.literal('').transform(() => null)),
  audius_handle: z.string().max(50).trim().optional().nullable(),
}).refine(d => Object.keys(d).length > 0, { message: 'No fields to update' });

/**
 * GET — return social connections for the current user.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('x_handle, instagram_handle, soundcloud_url, spotify_url, audius_handle')
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      x_handle: data?.x_handle || null,
      instagram_handle: data?.instagram_handle || null,
      soundcloud_url: data?.soundcloud_url || null,
      spotify_url: data?.spotify_url || null,
      audius_handle: data?.audius_handle || null,
    });
  } catch (err) {
    logger.error('[users/socials] GET error:', err);
    return NextResponse.json({ error: 'Failed to load socials' }, { status: 500 });
  }
}

/**
 * PATCH — update social connections.
 */
export async function PATCH(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(parsed.data)
      .eq('fid', session.fid);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[users/socials] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update socials' }, { status: 500 });
  }
}
