import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const statusSchema = z.object({
  castHash: z.string().min(1, 'castHash is required'),
});

/**
 * GET — Check cross-platform publish status for a given cast hash
 *
 * Returns all publish_log entries for the cast, showing which platforms
 * it was published to and their statuses.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = statusSchema.safeParse({
    castHash: searchParams.get('castHash'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { castHash } = parsed.data;

  try {
    const { data, error } = await supabaseAdmin
      .from('publish_log')
      .select('platform, status, platform_url, platform_post_id, error, created_at')
      .eq('cast_hash', castHash)
      .eq('fid', session.fid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[publish/status] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch publish status' }, { status: 500 });
    }

    const results = (data || []).map((row) => ({
      platform: row.platform,
      status: row.status,
      platformUrl: row.platform_url,
      platformPostId: row.platform_post_id,
      error: row.error,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[publish/status] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch publish status' }, { status: 500 });
  }
}
