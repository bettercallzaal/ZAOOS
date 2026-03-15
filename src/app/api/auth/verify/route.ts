import { NextRequest, NextResponse } from 'next/server';
import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { saveSession } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';

const appClient = createAppClient({
  ethereum: viemConnector(),
});

export async function POST(req: NextRequest) {
  try {
    const { message, signature, nonce, domain } = await req.json();

    if (!message || !signature || !nonce || !domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify SIWF signature
    const result = await appClient.verifySignInMessage({
      message,
      signature,
      nonce,
      domain,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const fid = result.fid;

    // Get user profile from Neynar
    const user = await getUserByFid(fid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check allowlist by FID and all addresses
    const custodyAddress = user.custody_address;
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const allAddresses = [custodyAddress, ...verifiedAddresses];

    let gateResult = await checkAllowlist(fid);
    if (!gateResult.allowed) {
      for (const addr of allAddresses) {
        if (!addr) continue;
        gateResult = await checkAllowlist(undefined, addr);
        if (gateResult.allowed) break;
      }
    }

    if (!gateResult.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Create session — store wallet address from Farcaster profile for consistency
    const primaryWallet = user.custody_address || verifiedAddresses[0] || '';
    await saveSession({
      fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      walletAddress: primaryWallet || undefined,
      authMethod: 'farcaster',
      signerUuid: null,
    });

    // Upsert user record in users table
    try {
      const wallet = (primaryWallet || '').toLowerCase();
      if (wallet) {
        const { data: existingByWallet } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('primary_wallet', wallet)
          .single();

        const { data: existingByFid } = !existingByWallet
          ? await supabaseAdmin.from('users').select('id').eq('fid', fid).single()
          : { data: null };

        const existing = existingByWallet || existingByFid;

        if (existing) {
          await supabaseAdmin
            .from('users')
            .update({
              fid,
              username: user.username,
              display_name: user.display_name,
              pfp_url: user.pfp_url,
              custody_address: custodyAddress,
              verified_addresses: verifiedAddresses,
              bio: user.profile?.bio?.text || null,
              role: 'member',
              last_login_at: new Date().toISOString(),
              ...(wallet ? { primary_wallet: wallet } : {}),
            })
            .eq('id', existing.id);
        } else {
          await supabaseAdmin.from('users').insert({
            primary_wallet: wallet,
            fid,
            username: user.username,
            display_name: user.display_name,
            pfp_url: user.pfp_url,
            custody_address: custodyAddress,
            verified_addresses: verifiedAddresses,
            bio: user.profile?.bio?.text || null,
            role: 'member',
            last_login_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to upsert user record:', err);
    }

    return NextResponse.json({
      success: true,
      redirect: '/chat',
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
