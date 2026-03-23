import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const LENS_API = 'https://api.lens.xyz/graphql';

/**
 * POST /api/platforms/lens
 * Body: { wallet: "0x..." } OR { handle, accessToken, refreshToken }
 * Checks if wallet owns a Lens profile via V3 API, stores the handle.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Accept either { wallet } or { handle, accessToken, ... } from the auth hook
  const wallet = body.wallet || session.walletAddress;
  if (!wallet) return NextResponse.json({ error: 'No wallet address' }, { status: 400 });

  try {
    // Query Lens V3 API for accounts owned by this wallet
    const res = await fetch(LENS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { accountsAvailable(request: { managedBy: "${wallet}", includeOwned: true }) { items { ... on AccountOwned { account { address username { localName value } metadata { name } } } ... on AccountManaged { account { address username { localName value } metadata { name } } } } } }`,
      }),
    });

    const data = await res.json();

    if (data?.errors) {
      console.error('[lens] V3 API errors:', JSON.stringify(data.errors));
    }

    const items = data?.data?.accountsAvailable?.items;
    let handle: string | null = null;
    let accountAddress: string | null = null;

    if (items && items.length > 0) {
      const account = items[0].account;
      accountAddress = account?.address;
      handle = account?.username?.localName
        || account?.metadata?.name
        || (accountAddress ? accountAddress.slice(0, 12) + '...' : null);
    }

    // Store what we found
    const updateData: Record<string, string | null> = {
      lens_profile_id: handle || `wallet:${wallet.slice(0, 10)}...`,
    };

    // If the hook sent tokens, store those too
    if (body.accessToken) updateData.lens_access_token = body.accessToken;
    if (body.refreshToken) updateData.lens_refresh_token = body.refreshToken;

    await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('fid', session.fid);

    return NextResponse.json({
      success: true,
      handle: handle || null,
      accountAddress,
      hasProfile: !!handle,
      message: handle
        ? `Connected as ${handle}`
        : 'No Lens profile found on this wallet. Create one at hey.xyz to cross-post.',
    });
  } catch (err) {
    console.error('[lens] Connect error:', err);
    return NextResponse.json({ error: 'Failed to check Lens profile' }, { status: 500 });
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
