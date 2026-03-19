import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { syncMemberPosts } from '@/lib/bluesky/feed';

/**
 * POST — Sync Bluesky member posts into the feed index (admin only)
 * Fetches recent posts from all tracked ZAO members on Bluesky.
 */
export async function POST() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await syncMemberPosts();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[bluesky/sync] Error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
