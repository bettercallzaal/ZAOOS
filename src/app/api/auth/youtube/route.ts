import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'YouTube client ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/youtube/callback`;
  const scopes = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl';

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', String(session.fid));

  return NextResponse.redirect(url.toString());
}
