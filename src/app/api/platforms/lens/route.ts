import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const connectSchema = z.object({
  handle: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accountAddress: z.string().optional(),
});

/**
 * POST /api/platforms/lens
 * Receives Lens V3 session tokens from client-side auth (useLensAuth hook).
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { handle, accessToken, refreshToken } = parsed.data;

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        lens_profile_id: handle,
        lens_access_token: accessToken,
        lens_refresh_token: refreshToken,
      })
      .eq('fid', session.fid);

    if (error) throw error;

    return NextResponse.json({ success: true, handle });
  } catch (err) {
    console.error('[platforms/lens] Save error:', err);
    return NextResponse.json({ error: 'Failed to save Lens connection' }, { status: 500 });
  }
}

/**
 * DELETE — Disconnect Lens.
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await supabaseAdmin
      .from('users')
      .update({ lens_profile_id: null, lens_access_token: null, lens_refresh_token: null })
      .eq('fid', session.fid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[platforms/lens] Disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
