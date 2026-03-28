import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Twitch client ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/twitch/callback`;
  const scopes = 'channel:read:stream_key channel:manage:broadcast chat:read';

  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', String(session.fid));

  return NextResponse.redirect(url.toString());
}
