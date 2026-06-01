/**
 * Miniapp silent auth — QuickAuth-verified (no SIWF signature prompt).
 *
 * SECURITY (doc 795): the FID is taken from a verified QuickAuth JWT
 * (`payload.sub`), never from the request body. An earlier version trusted an
 * UNSIGNED `fid` in the POST body, which let any unauthenticated caller mint a
 * session — including an admin session, since `saveSession` derives `isAdmin`
 * from the FID — for any allowlisted FID (admin FIDs are public). That was a
 * live account-takeover / privilege-escalation bypass; this route now requires
 * a verified credential before `saveSession`, identical to /api/miniapp/auth.
 *
 * The client attaches the token via `sdk.quickAuth.fetch(...)`. QuickAuth is
 * silent (a JWT signed by the Farcaster client, not a SIWF signature prompt),
 * so the no-prompt UX is preserved.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@farcaster/quick-auth';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { saveSession } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

const quickAuthClient = createClient();

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // QuickAuth JWTs are tied to the domain in the Farcaster manifest
    // (zaoos.com), not the request host — verify against the pinned domain.
    const domain = ENV.NEXT_PUBLIC_SIWF_DOMAIN || 'zaoos.com';

    let fid: number;
    try {
      const payload = await quickAuthClient.verifyJwt({ token, domain });
      fid = Number(payload.sub);
    } catch {
      // Invalid / expired / wrong-domain token — never falls through to a
      // body-supplied FID.
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!Number.isInteger(fid) || fid <= 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const neynarUser = await getUserByFid(fid);
    if (!neynarUser) {
      return NextResponse.json({ error: 'FID not found' }, { status: 404 });
    }

    const gate = await checkAllowlist(fid);
    let hasAccess = gate.allowed;

    if (!hasAccess && neynarUser.verified_addresses?.eth_addresses) {
      for (const addr of neynarUser.verified_addresses.eth_addresses) {
        const walletCheck = await checkAllowlist(undefined, addr);
        if (walletCheck.allowed) {
          hasAccess = true;
          break;
        }
      }
    }

    if (hasAccess) {
      await saveSession({
        fid,
        username: neynarUser.username || '',
        displayName: neynarUser.display_name || '',
        pfpUrl: neynarUser.pfp_url || '',
      });
    }

    return NextResponse.json({
      fid,
      hasAccess,
      username: neynarUser.username || '',
      displayName: neynarUser.display_name || '',
      pfpUrl: neynarUser.pfp_url || '',
    });
  } catch (error: unknown) {
    logger.error('Miniapp context auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
