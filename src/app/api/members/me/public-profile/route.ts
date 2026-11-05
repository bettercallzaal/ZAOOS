import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import {
  isPublicProfileColumnMissing,
  PUBLIC_FIELDS,
  type PublicField,
  publicProfileUpdateSchema,
} from '@/lib/members/public-profile';

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const NOT_READY = { error: 'Public profiles are not switched on yet' };

/** Which users column backs each toggle, so settings can flag an empty field. */
const FIELD_COLUMNS: Partial<Record<PublicField, string>> = {
  username: 'username',
  avatar: 'pfp_url',
  real_name: 'real_name',
  bio: 'bio',
  location: 'location',
  website: 'website_url',
  x: 'x_handle',
  instagram: 'instagram_handle',
  bluesky: 'bluesky_handle',
  soundcloud: 'soundcloud_url',
  spotify: 'spotify_url',
  audius: 'audius_handle',
  discord: 'discord_id',
};

const SELECT_COLUMNS = ['id', 'public_name', 'public_fields', ...Object.values(FIELD_COLUMNS)].join(
  ', ',
);

/**
 * GET /api/members/me/public-profile: the signed-in member's own opt-in state.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(SELECT_COLUMNS)
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (isPublicProfileColumnMissing(error)) {
      return NextResponse.json(NOT_READY, { status: 503, headers: NO_STORE });
    }
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = data as unknown as Record<string, unknown>;
    const known = new Set<string>(PUBLIC_FIELDS);
    const empty = Object.entries(FIELD_COLUMNS)
      .filter(([, column]) => !row[column as string])
      .map(([field]) => field);

    return NextResponse.json(
      {
        name: (row.public_name as string | null) ?? '',
        fields: ((row.public_fields as string[] | null) ?? []).filter((f) => known.has(f)),
        empty,
        // For the share link: the handle only counts once the member makes it public.
        id: row.id,
        username: (row.username as string | null) ?? null,
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    logger.error('[members/me/public-profile] GET error:', err);
    return NextResponse.json({ error: 'Failed to load public profile' }, { status: 500 });
  }
}

/**
 * PUT /api/members/me/public-profile: set the name and toggles. The target row
 * always comes from the session. The strict schema rejects any fid in the body.
 */
export async function PUT(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = publicProfileUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid public profile', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ public_name: parsed.data.name, public_fields: parsed.data.fields })
      .eq('fid', session.fid)
      .eq('is_active', true)
      .select('fid');

    if (isPublicProfileColumnMissing(error)) {
      return NextResponse.json(NOT_READY, { status: 503, headers: NO_STORE });
    }
    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    revalidatePath('/members');
    return NextResponse.json(parsed.data, { headers: NO_STORE });
  } catch (err) {
    logger.error('[members/me/public-profile] PUT error:', err);
    return NextResponse.json({ error: 'Failed to save public profile' }, { status: 500 });
  }
}

/**
 * DELETE /api/members/me/public-profile: leave. Clears the name and every toggle.
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ public_name: null, public_fields: [] })
      .eq('fid', session.fid)
      .eq('is_active', true);

    if (isPublicProfileColumnMissing(error)) {
      return NextResponse.json(NOT_READY, { status: 503, headers: NO_STORE });
    }
    if (error) throw error;

    revalidatePath('/members');
    return NextResponse.json({ name: '', fields: [] }, { headers: NO_STORE });
  } catch (err) {
    logger.error('[members/me/public-profile] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove public profile' }, { status: 500 });
  }
}
