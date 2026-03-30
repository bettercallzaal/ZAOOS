import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { fetchThreadsInsights } from '@/lib/publish/threads-insights';
import { isThreadsConfigured } from '@/lib/publish/threads';

/**
 * GET /api/cron/engagement-collect
 *
 * Vercel cron-compatible route that fetches engagement metrics
 * for recent Threads posts (last 30 days) and stores snapshots
 * in the engagement_metrics table.
 *
 * Auth: Bearer CRON_SECRET (skipped in dev if CRON_SECRET not set)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check: verify CRON_SECRET if set
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!isThreadsConfigured()) {
      return NextResponse.json(
        { error: 'Threads not configured', collected: 0 },
        { status: 503 },
      );
    }

    // Fetch recent Threads posts from publish_log (last 30 days)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('publish_log')
      .select('id, platform_post_id')
      .eq('platform', 'threads')
      .eq('status', 'published')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('[cron/engagement-collect] DB error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ collected: 0, message: 'No recent Threads posts' });
    }

    // Fetch insights for each post (fault-tolerant)
    const results = await Promise.allSettled(
      posts.map(async (post) => {
        const metrics = await fetchThreadsInsights(post.platform_post_id);

        const { error: insertError } = await supabaseAdmin
          .from('engagement_metrics')
          .insert({
            publish_log_id: post.id,
            platform: 'threads',
            platform_post_id: post.platform_post_id,
            views: metrics.views,
            likes: metrics.likes,
            replies: metrics.replies,
            reposts: metrics.reposts,
            quotes: metrics.quotes,
            clicks: 0,
            fetched_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            `[cron/engagement-collect] Insert error for ${post.platform_post_id}:`,
            insertError,
          );
          throw insertError;
        }

        return post.platform_post_id;
      }),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `[cron/engagement-collect] Collected ${succeeded}/${posts.length} posts (${failed} failed)`,
    );

    return NextResponse.json({
      collected: succeeded,
      failed,
      total: posts.length,
    });
  } catch (err) {
    console.error('[cron/engagement-collect] Error:', err);
    return NextResponse.json({ error: 'Engagement collection failed' }, { status: 500 });
  }
}
