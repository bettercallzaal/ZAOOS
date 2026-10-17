import { type NextRequest, NextResponse } from 'next/server';
import { issueNonce } from '@/lib/nonces';
import { clientIp, limits } from '@/lib/rate-limit';
import { getSession } from '@/lib/session';

/**
 * GET - a single-use nonce for Sign In With Farcaster. Stored server-side
 * (consumed once by /api/auth/verify) and in the session cookie (so it is
 * bound to this browser).
 */
export async function GET(req: NextRequest) {
  const limited = limits.nonce(`nonce:${clientIp(req.headers)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    );
  }
  try {
    const nonce = await issueNonce();
    const session = await getSession();
    session.nonce = nonce;
    await session.save();
    return NextResponse.json({ nonce });
  } catch (error: unknown) {
    console.error('[auth/nonce]', error);
    return NextResponse.json({ error: 'Could not start sign-in. Please try again.' }, { status: 503 });
  }
}
