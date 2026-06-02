/**
 * Shared QuickAuth verification for the miniapp auth routes.
 *
 * Both /api/miniapp/auth (GET) and /api/miniapp/auth-context (POST) authenticate
 * a Farcaster miniapp user from a verified QuickAuth JWT. The FID is taken from
 * the verified `payload.sub` — NEVER from the request body (see doc 795: an
 * earlier version trusted an unsigned body FID, an account-takeover bypass).
 * This module is the single source of truth for that flow.
 */
import { createClient } from '@farcaster/quick-auth';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { saveSession } from '@/lib/auth/session';
import { ENV } from '@/lib/env';

const quickAuthClient = createClient();

export interface MiniappAuthResult {
  status: number;
  body: Record<string, unknown>;
}

/** Extract a non-empty bearer token from an Authorization header, or null. */
export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * Verify a QuickAuth JWT, gate the FID against the allowlist (by FID, then by
 * verified wallet), and mint a session on success. Returns the HTTP status +
 * JSON body the route should respond with. Throws only on unexpected errors;
 * the caller wraps this in try/catch for a 500.
 */
export async function authenticateMiniappToken(token: string): Promise<MiniappAuthResult> {
  // QuickAuth JWTs are tied to the domain in the Farcaster manifest (zaoos.com),
  // not the request host — verify against the pinned domain.
  const domain = ENV.NEXT_PUBLIC_SIWF_DOMAIN || 'zaoos.com';

  let fid: number;
  try {
    const payload = await quickAuthClient.verifyJwt({ token, domain });
    fid = Number(payload.sub);
  } catch {
    return { status: 401, body: { error: 'Invalid token' } };
  }
  if (!Number.isInteger(fid) || fid <= 0) {
    return { status: 401, body: { error: 'Invalid token' } };
  }

  const neynarUser = await getUserByFid(fid);
  if (!neynarUser) {
    return { status: 404, body: { error: 'FID not found' } };
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

  return {
    status: 200,
    body: {
      fid,
      hasAccess,
      username: neynarUser.username || '',
      displayName: neynarUser.display_name || '',
      pfpUrl: neynarUser.pfp_url || '',
    },
  };
}
