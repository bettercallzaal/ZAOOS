import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const LENS_API = 'https://api.lens.xyz/graphql';

async function checkLensProfile(wallet: string) {
  const res = await fetch(LENS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { accountsAvailable(request: { managedBy: "${wallet}", includeOwned: true }) { items { ... on AccountOwned { account { address username { localName value } metadata { name } } } ... on AccountManaged { account { address username { localName value } metadata { name } } } } } }`,
    }),
  });
  const data = await res.json();
  if (data?.errors) {
    console.error('[lens] V3 API errors for', wallet, ':', JSON.stringify(data.errors));
  }
  return data?.data?.accountsAvailable?.items || [];
}

/**
 * POST /api/platforms/lens
 * Body: { wallet?: "0x..." }
 * Checks ALL of the user's Farcaster verified addresses + primary wallet for a Lens profile.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  try {
    // Get ALL wallets associated with this user (primary + verified from Farcaster)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('primary_wallet, custody_address, verified_addresses')
      .eq('fid', session.fid)
      .single();

    const walletsToCheck = new Set<string>();
    if (body.wallet) walletsToCheck.add(body.wallet.toLowerCase());
    if (session.walletAddress) walletsToCheck.add(session.walletAddress.toLowerCase());
    if (user?.primary_wallet) walletsToCheck.add(user.primary_wallet.toLowerCase());
    if (user?.custody_address) walletsToCheck.add(user.custody_address.toLowerCase());
    if (Array.isArray(user?.verified_addresses)) {
      for (const addr of user.verified_addresses) {
        if (typeof addr === 'string' && addr.startsWith('0x')) {
          walletsToCheck.add(addr.toLowerCase());
        }
      }
    }

    console.info('[lens] Checking wallets:', [...walletsToCheck]);

    // Check each wallet for a Lens profile
    let handle: string | null = null;
    let accountAddress: string | null = null;
    let matchedWallet: string | null = null;

    for (const wallet of walletsToCheck) {
      const items = await checkLensProfile(wallet);
      if (items.length > 0) {
        const account = items[0].account;
        accountAddress = account?.address;
        handle = account?.username?.localName
          || account?.username?.value
          || account?.metadata?.name
          || (accountAddress ? accountAddress.slice(0, 12) + '...' : null);
        matchedWallet = wallet;
        break;
      }
    }

    // Store what we found
    const updateData: Record<string, string | null> = {
      lens_profile_id: handle || null,
    };
    if (body.accessToken) updateData.lens_access_token = body.accessToken;
    if (body.refreshToken) updateData.lens_refresh_token = body.refreshToken;

    await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('fid', session.fid);

    return NextResponse.json({
      success: true,
      handle,
      accountAddress,
      matchedWallet,
      walletsChecked: walletsToCheck.size,
      hasProfile: !!handle,
      message: handle
        ? `Connected as ${handle} (found on ${matchedWallet?.slice(0, 8)}...)`
        : `No Lens profile found on ${walletsToCheck.size} wallet(s). Create one at hey.xyz to cross-post.`,
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
