import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const LENS_API = 'https://api-v2.lens.dev';

async function lensGql(query: string, variables?: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['x-access-token'] = `Bearer ${token}`;
  const res = await fetch(LENS_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

/**
 * GET /api/platforms/lens?wallet=0x...
 * Step 1: Get a Lens challenge for the wallet to sign.
 * Returns { challengeId, challengeText } — client signs challengeText with wallet.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'wallet param required' }, { status: 400 });

  try {
    // Check if wallet has a Lens profile
    const profileData = await lensGql(
      `query DefaultProfile($request: DefaultProfileRequest!) { defaultProfile(request: $request) { id handle { localName fullHandle } } }`,
      { request: { for: wallet } },
    );
    const profile = profileData?.data?.defaultProfile;

    // Get challenge (works with or without profile)
    const challengeData = await lensGql(
      `mutation Challenge($request: ChallengeRequest!) { challenge(request: $request) { id text } }`,
      { request: { signedBy: wallet, for: profile?.id || null } },
    );
    const challenge = challengeData?.data?.challenge;
    if (!challenge?.text) {
      console.error('[lens] Challenge failed:', JSON.stringify(challengeData));
      return NextResponse.json({ error: 'Failed to get Lens challenge' }, { status: 502 });
    }

    return NextResponse.json({
      challengeId: challenge.id,
      challengeText: challenge.text,
      profileId: profile?.id || null,
      handle: profile?.handle?.fullHandle || profile?.handle?.localName || null,
    });
  } catch (err) {
    console.error('[lens] Challenge error:', err);
    return NextResponse.json({ error: 'Failed to connect to Lens' }, { status: 502 });
  }
}

const authenticateSchema = z.object({
  challengeId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * POST /api/platforms/lens
 * Step 2: Submit the signed challenge to authenticate with Lens.
 * Body: { challengeId, signature }
 * Stores tokens + profile info in users table.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = authenticateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const { challengeId, signature } = parsed.data;

  try {
    // Authenticate with Lens
    const authData = await lensGql(
      `mutation Authenticate($request: SignedAuthChallenge!) { authenticate(request: $request) { accessToken refreshToken } }`,
      { request: { id: challengeId, signature } },
    );
    const tokens = authData?.data?.authenticate;
    if (!tokens?.accessToken) {
      console.error('[lens] Auth failed:', JSON.stringify(authData));
      return NextResponse.json({ error: 'Lens authentication failed — make sure you have a Lens profile' }, { status: 400 });
    }

    // Get profile info using the token
    const profileData = await lensGql(
      `query { userSigNonces { lensHubOnchainSigNonce } }`,
      undefined,
      tokens.accessToken,
    );

    // Also get the profile
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('primary_wallet')
      .eq('fid', session.fid)
      .single();

    let profileId = 'connected';
    let handle = 'connected';
    if (userData?.primary_wallet) {
      const pData = await lensGql(
        `query DefaultProfile($request: DefaultProfileRequest!) { defaultProfile(request: $request) { id handle { localName fullHandle } } }`,
        { request: { for: userData.primary_wallet } },
        tokens.accessToken,
      );
      const profile = pData?.data?.defaultProfile;
      if (profile) {
        profileId = profile.id;
        handle = profile.handle?.fullHandle || profile.handle?.localName || profile.id;
      }
    }

    // Save to DB
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        lens_profile_id: handle || profileId,
        lens_access_token: tokens.accessToken,
        lens_refresh_token: tokens.refreshToken,
      })
      .eq('fid', session.fid);

    if (error) {
      console.error('[lens] DB save error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profileId: handle || profileId });
  } catch (err) {
    console.error('[lens] Auth error:', err);
    return NextResponse.json({ error: 'Lens authentication failed' }, { status: 500 });
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
