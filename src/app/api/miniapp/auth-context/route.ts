/**
 * Miniapp context-based auth — silent (no SIWF signature prompt).
 *
 * Reads FID from request body (provided by client via sdk.context.user.fid).
 * Trust model: the FID claim is UNSIGNED. A non-Farcaster caller could POST
 * any allowlisted FID and obtain a session for that user. Acceptable for
 * gating an invite-only community where the alternative is a SIWF prompt
 * every miniapp launch. For sensitive ops, keep using /api/miniapp/auth
 * (QuickAuth/JWT-verified).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { saveSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const BodySchema = z.object({
  fid: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const { fid } = parsed.data;

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
