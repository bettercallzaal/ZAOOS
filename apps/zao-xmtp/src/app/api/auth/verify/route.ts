import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordSignIn } from '@/lib/directory';
import { appDomain, hubUrl, optimismRpcUrl } from '@/lib/env';
import { getProfile, getVerifiedEthAddresses } from '@/lib/hub';
import { checkRespect, optimismClient } from '@/lib/respect';
import { getSession } from '@/lib/session';

const verifySchema = z.object({
  message: z.string().min(1).max(4000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

let _appClient: ReturnType<typeof createAppClient> | null = null;
function appClient() {
  if (!_appClient) {
    _appClient = createAppClient({ ethereum: viemConnector({ rpcUrl: optimismRpcUrl() }) });
  }
  return _appClient;
}

/**
 * POST - verify the SIWF signature, then the Respect gate, then start a session.
 * 401 bad signature, 403 no Respect, 503 could not check (never reported as "no Respect").
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = verifySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const session = await getSession();
    const nonce = session.nonce;
    session.nonce = undefined;
    await session.save();
    if (!nonce) {
      return NextResponse.json({ error: 'Sign-in expired. Please try again.' }, { status: 400 });
    }

    let result: Awaited<ReturnType<ReturnType<typeof createAppClient>['verifySignInMessage']>>;
    try {
      result = await appClient().verifySignInMessage({
        message: parsed.data.message,
        signature: parsed.data.signature as `0x${string}`,
        nonce,
        domain: appDomain(),
      });
    } catch (error: unknown) {
      console.error('[auth/verify] SIWF verification error:', error);
      return NextResponse.json({ error: 'Could not verify sign-in. Please try again.' }, { status: 503 });
    }
    if (result.isError || !result.success || typeof result.fid !== 'number') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const fid = result.fid;
    const custody = result.data.address;
    const verified = await getVerifiedEthAddresses(fid, { hubUrl: hubUrl() });
    if (verified === null) {
      return NextResponse.json(
        { error: 'Could not check your Respect right now. Please try again.', code: 'respect-unknown' },
        { status: 503 },
      );
    }

    const check = await checkRespect([custody, ...verified], optimismClient(optimismRpcUrl()));
    if (check.status === 'unknown') {
      console.error(`[auth/verify] Respect check unknown for fid ${fid}: ${check.reason}`);
      return NextResponse.json(
        { error: 'Could not check your Respect right now. Please try again.', code: 'respect-unknown' },
        { status: 503 },
      );
    }
    if (check.status === 'not-member') {
      return NextResponse.json(
        {
          error: 'ZAO XMTP is for ZAO Respect holders. No OG or ZOR Respect was found on your Farcaster addresses.',
          code: 'no-respect',
          checked: check.checked,
        },
        { status: 403 },
      );
    }

    const profile = await getProfile(fid, { hubUrl: hubUrl() });
    session.fid = fid;
    session.username = profile.username;
    session.displayName = profile.displayName;
    session.pfpUrl = profile.pfpUrl;
    session.isMember = true;
    session.respectCheckedAt = new Date().toISOString();
    await session.save();

    // Signed in either way, but a failed directory write is reported, not hidden:
    // without it other members cannot find this one.
    let directoryWarning: string | undefined;
    try {
      await recordSignIn({ fid, ...profile });
    } catch (error: unknown) {
      console.error('[auth/verify] directory write failed:', error);
      directoryWarning = 'Signed in, but you could not be added to the member directory yet.';
    }

    return NextResponse.json({ ok: true, fid, username: profile.username, directoryWarning });
  } catch (error: unknown) {
    console.error('[auth/verify]', error);
    return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 });
  }
}
