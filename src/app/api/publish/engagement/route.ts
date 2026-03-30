import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  platform: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET — Fetch engagement metrics for published posts.
 *
 * Admin-only. Returns the latest engagement snapshot per post,
 * optionally filtered by platform.
 *
 * Query params:
 *   ?platform=threads  — filter by platform
 *   ?limit=20          — max results (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const parsed = querySchema.safeParse({
      platform: searchParams.get('platform') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { platform, limit } = parsed.data;

    // Get latest engagement snapshot for each post, joined with publish_log
    let query = supabaseAdmin
      .from('engagement_metrics')
      .select(`
        id,
        publish_log_id,
        platform,
        platform_post_id,
        views,
        likes,
        replies,
        reposts,
        quotes,
        clicks,
        fetched_at,
        publish_log (
          cast_hash,
          platform_url,
          text,
          published_by_fid,
          created_at
        )
      `)
      .order('fetched_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[publish/engagement] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 });
    }

    return NextResponse.json({ metrics: data || [] });
  } catch (err) {
    console.error('[publish/engagement] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 });
  }
}
