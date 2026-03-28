import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import crypto from 'crypto';

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Kick client ID not configured' }, { status: 500 });
  }

  const { verifier, challenge } = generatePKCE();

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/kick/callback`;
  const scopes = 'user:read channel:read channel:write';

  const url = new URL('https://id.kick.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', String(session.fid));

  const response = NextResponse.redirect(url.toString());
  // Store verifier in httpOnly cookie for retrieval in callback
  response.cookies.set('kick_pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes — enough for the OAuth flow
    path: '/',
  });

  return response;
}
