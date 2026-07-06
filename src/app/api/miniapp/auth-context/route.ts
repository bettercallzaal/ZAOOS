/**
 * Miniapp context-based auth — silent (no SIWF signature prompt).
 *
 * Reads FID from request body (provided by client via sdk.context.user.fid).
 * Trust model: the FID claim is UNSIGNED. A non-Farcaster caller could POST
 * any allowlisted FID and obtain a session for that user. Acceptable for
 * gating an invite-only community where the alternative is a SIWF prompt
 * every miniapp launch. For sensitive ops, keep using /api/miniapp/auth
 * (QuickAuth/JWT-verified).
 *
 * HARDENED 2026-06: this path NEVER grants isAdmin (saveSession allowAdmin:false)
 * because the FID is unsigned. Admin only comes from the JWT-verified sibling.
 * TODO: consolidate both routes onto QuickAuth JWT (sdk.quickAuth.fetch) to also
 * close the unsigned-FID account-impersonation surface — needs a real
 * miniapp-launch test before flipping the client.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { checkAllowlist } from '@/lib/gates/allowlist';
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

    // SECURITY: FID is UNSIGNED (client-supplied). Do NOT persist a session
    // from this path — this would allow account impersonation. Return only
    // a read-only context flag for UI purposes. Sensitive operations must use
    // the JWT-verified /api/miniapp/auth path (QuickAuth). See GitHub issue.
    return NextResponse.json({
      allowlisted: hasAccess,
      fid,
      username: neynarUser.username || '',
      displayName: neynarUser.display_name || '',
      pfpUrl: neynarUser.pfp_url || '',
    });
  } catch (error: unknown) {
    logger.error('Miniapp context auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
