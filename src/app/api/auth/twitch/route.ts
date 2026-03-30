import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Twitch client ID not configured' }, { status: 500 });
  }

  const redirectUri = 'https://zaoos.com/api/auth/twitch/callback';
  const scopes = 'channel:read:stream_key channel:manage:broadcast chat:read chat:edit channel:manage:polls channel:manage:predictions clips:edit channel:read:subscriptions moderator:read:followers';

  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', String(session.fid));

  return NextResponse.redirect(url.toString());
}
