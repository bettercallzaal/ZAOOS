import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const updateSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website_url: z.string().url().max(200).or(z.literal('')).optional(),
  bluesky_handle: z.string().max(100).optional(),
  x_handle: z.string().max(100).optional(),
  instagram_handle: z.string().max(100).optional(),
  soundcloud_url: z.string().max(200).optional(),
  spotify_url: z.string().max(200).optional(),
  audius_handle: z.string().max(100).optional(),
  discord_id: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  preferred_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
});

/**
 * GET /api/members/me — Return current user's editable profile fields
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('bio, location, website_url, bluesky_handle, x_handle, instagram_handle, soundcloud_url, spotify_url, audius_handle, discord_id, tags, preferred_wallet, primary_wallet, verified_addresses')
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('[members/me] GET error:', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

/**
 * POST /api/members/me — Update current user's profile
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.bio !== undefined) updates.bio = data.bio || null;
    if (data.location !== undefined) updates.location = data.location || null;
    if (data.website_url !== undefined) updates.website_url = data.website_url || null;
    if (data.bluesky_handle !== undefined) updates.bluesky_handle = data.bluesky_handle || null;
    if (data.x_handle !== undefined) updates.x_handle = data.x_handle || null;
    if (data.instagram_handle !== undefined) updates.instagram_handle = data.instagram_handle || null;
    if (data.soundcloud_url !== undefined) updates.soundcloud_url = data.soundcloud_url || null;
    if (data.spotify_url !== undefined) updates.spotify_url = data.spotify_url || null;
    if (data.audius_handle !== undefined) updates.audius_handle = data.audius_handle || null;
    if (data.discord_id !== undefined) updates.discord_id = data.discord_id || null;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.preferred_wallet !== undefined) updates.preferred_wallet = data.preferred_wallet;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('fid', session.fid)
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({ ok: true, updated: Object.keys(updates) });
  } catch (err) {
    console.error('[members/me] POST error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
