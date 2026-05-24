import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import { mintPartnerToken } from '@/lib/spaces/juke-partner-token';

/**
 * GET /api/juke/partner-token
 *
 * Mints a short-lived Juke partner JWT for the CURRENT signed-in ZAO user
 * (whose FID lives on their session). Returns `{ token, fid, expires_at }`
 * to the browser; the caller passes the token on the Juke embed URL via
 * `?token=...` so the iframe adopts the session without re-running SIWF.
 *
 * Auth: session-bound. No admin requirement - any authed ZAO user can mint
 * a token for their own FID. We never accept an FID from the request; it
 * comes straight from the session.
 *
 * Rate limits live upstream at Juke (60/min + 5,000/day per developer key);
 * if we hit that the route surfaces the upstream status.
 *
 * No caching - the JWT is single-use-per-iframe-mount, short-TTL, and CDN
 * caching it would be a security mistake.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json(
      { ok: false, error: 'Sign in to mint a partner token' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const apiKey = ENV.JUKE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'JUKE_API_KEY not configured on the server' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const result = await mintPartnerToken(apiKey, { fid: session.fid, ttlSeconds: 300 });
  if (!result.ok) {
    logger.warn('[juke/partner-token] mint failed', result.status, result.error);
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status >= 500 ? 502 : result.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      token: result.data.token,
      fid: result.data.fid,
      expires_at: result.data.expires_at,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        // Token has fid + expiry; not safe to share across users.
        'X-ZAO-Juke-Partner-Token': 'v1',
      },
    },
  );
}
