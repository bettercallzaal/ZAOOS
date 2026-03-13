import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { searchUsers } from '@/lib/farcaster/neynar';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  try {
    const data = await searchUsers(q, 6);
    const users = (data.result?.users || []).map((u: Record<string, unknown>) => ({
      fid: u.fid,
      username: u.username,
      display_name: u.display_name,
      pfp_url: u.pfp_url,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ users: [] });
  }
}
