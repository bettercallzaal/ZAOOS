import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: 'Facebook app ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/facebook/callback`;
  const scopes = 'publish_video,pages_manage_posts,pages_read_engagement';

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', String(session.fid));

  return NextResponse.redirect(url.toString());
}
