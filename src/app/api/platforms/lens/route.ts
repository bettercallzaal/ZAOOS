import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const connectSchema = z.object({
  profileId: z.string().min(1, 'Profile ID or handle is required'),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

/**
 * POST — Connect a Lens Protocol profile to the current user.
 *
 * The frontend handles Lens authentication (via the Lens login flow)
 * and sends the resulting profile ID + tokens here for storage.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { profileId, accessToken, refreshToken } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { lens_profile_id: profileId };
    if (accessToken) updateData.lens_access_token = accessToken;
    if (refreshToken) updateData.lens_refresh_token = refreshToken;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('fid', session.fid);

    if (error) {
      console.error('[platforms/lens] DB update error:', error);
      return NextResponse.json({ error: 'Failed to save Lens connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profileId });
  } catch (err) {
    console.error('[platforms/lens] Connect error:', err);
    return NextResponse.json({ error: 'Failed to connect Lens profile' }, { status: 500 });
  }
}

/**
 * DELETE — Disconnect the current user's Lens Protocol profile.
 *
 * Nulls out all three Lens columns (profile ID, access token, refresh token).
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        lens_profile_id: null,
        lens_access_token: null,
        lens_refresh_token: null,
      })
      .eq('fid', session.fid);

    if (error) {
      console.error('[platforms/lens] Disconnect error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[platforms/lens] Disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect Lens profile' }, { status: 500 });
  }
}
