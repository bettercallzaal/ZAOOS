import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getChannelFeed } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;

    // Fetch channel feed from Neynar
    const feed = await getChannelFeed('zao', cursor);
    const casts = feed.casts || [];

    // Get hidden message hashes
    const castHashes = casts.map((c: { hash: string }) => c.hash);
    const { data: hiddenData } = await supabaseAdmin
      .from('hidden_messages')
      .select('cast_hash')
      .in('cast_hash', castHashes.length > 0 ? castHashes : ['none']);

    const hiddenHashes = new Set((hiddenData || []).map((h: { cast_hash: string }) => h.cast_hash));

    // Filter out hidden messages
    const visibleCasts = casts.filter((c: { hash: string }) => !hiddenHashes.has(c.hash));

    return NextResponse.json({
      casts: visibleCasts,
      next: feed.next,
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
