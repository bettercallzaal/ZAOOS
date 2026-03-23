import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const LENS_API = 'https://api-v2.lens.dev';

/**
 * POST /api/platforms/lens
 * Body: { wallet: "0x..." }
 * Looks up if the wallet has a Lens profile and stores it.
 * No auth tokens needed — those are handled at publish time.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { wallet?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const wallet = body.wallet;
  if (!wallet || !wallet.startsWith('0x')) {
    return NextResponse.json({ error: 'Valid wallet address required' }, { status: 400 });
  }

  try {
    // Try to find a Lens profile for this wallet
    const res = await fetch(LENS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query Profiles($request: ProfilesRequest!) { profiles(request: $request) { items { id handle { fullHandle localName } } } }`,
        variables: { request: { where: { ownedBy: [wallet] } } },
      }),
    });

    if (!res.ok) {
      console.error('[lens] API error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'Lens API unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const profiles = data?.data?.profiles?.items;

    if (!profiles || profiles.length === 0) {
      // No Lens profile — still save wallet as "pending" connection
      await supabaseAdmin
        .from('users')
        .update({ lens_profile_id: `wallet:${wallet}` })
        .eq('fid', session.fid);

      return NextResponse.json({
        success: true,
        profileId: null,
        handle: null,
        message: 'No Lens profile found on this wallet. You can create one at hey.xyz. Cross-posting will use your wallet address.',
      });
    }

    // Use the first profile
    const profile = profiles[0];
    const handle = profile.handle?.fullHandle || profile.handle?.localName || profile.id;

    await supabaseAdmin
      .from('users')
      .update({ lens_profile_id: handle })
      .eq('fid', session.fid);

    return NextResponse.json({ success: true, profileId: profile.id, handle });
  } catch (err) {
    console.error('[lens] Connect error:', err);
    return NextResponse.json({ error: 'Failed to look up Lens profile' }, { status: 500 });
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
    console.error('[lens] Disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
