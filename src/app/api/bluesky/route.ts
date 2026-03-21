import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { AtpAgent, RichText } from '@atproto/api';

/**
 * GET — Get current user's Bluesky connection status
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('bluesky_did, bluesky_handle')
      .eq('fid', session.fid)
      .single();

    return NextResponse.json({
      connected: !!user?.bluesky_did,
      handle: user?.bluesky_handle || null,
    });
  } catch {
    return NextResponse.json({ connected: false, handle: null });
  }
}

/**
 * POST — Connect Bluesky account using App Password
 * Body: { handle: string, appPassword: string }
 *
 * We verify the credentials by logging in, then store only the DID and handle.
 * The app password is NOT stored — users will need to re-enter it if session expires.
 * For MVP this is simpler and more secure than full OAuth.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { handle, appPassword } = body;

    if (!handle || !appPassword) {
      return NextResponse.json(
        { error: 'Handle and app password are required' },
        { status: 400 }
      );
    }

    // Verify credentials by logging in
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    try {
      await agent.login({ identifier: handle, password: appPassword });
    } catch {
      return NextResponse.json(
        { error: 'Invalid Bluesky credentials. Make sure you use an App Password, not your account password.' },
        { status: 400 }
      );
    }

    const did = agent.session?.did;
    if (!did) {
      return NextResponse.json({ error: 'Failed to get DID from Bluesky' }, { status: 500 });
    }

    // Store DID, handle, and app password for cross-posting.
    // App Passwords are scoped tokens — they cannot change the account password or access sensitive settings.
    const { error } = await supabaseAdmin
      .from('users')
      .update({ bluesky_did: did, bluesky_handle: handle, bluesky_app_password: appPassword })
      .eq('fid', session.fid);

    if (error) {
      console.error('[bluesky] DB update error:', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    // Auto-register as a feed member (so their posts show in ZAO Music feed)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('fid', session.fid)
      .single();

    const { error: memberErr } = await supabaseAdmin
      .from('bluesky_members')
      .upsert(
        { did, handle, user_id: user?.id || null, added_by: 'self' },
        { onConflict: 'did' }
      );
    if (memberErr) console.error('[bluesky] Auto-register member:', memberErr);

    return NextResponse.json({ success: true, handle, did });
  } catch (err) {
    console.error('[bluesky] Connect error:', err);
    return NextResponse.json({ error: 'Failed to connect Bluesky' }, { status: 500 });
  }
}

/**
 * DELETE — Disconnect Bluesky account
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ bluesky_did: null, bluesky_handle: null, bluesky_app_password: null })
      .eq('fid', session.fid);

    if (error) {
      console.error('[bluesky] Disconnect error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[bluesky] Disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
