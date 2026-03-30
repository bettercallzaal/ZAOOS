import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { fetchThreadsInsights } from '@/lib/publish/threads-insights';
import { isThreadsConfigured } from '@/lib/publish/threads';
import { fetchXInsights } from '@/lib/publish/x-insights';
import { getXClient } from '@/lib/publish/x';

interface CollectResult {
  platform: string;
  collected: number;
  failed: number;
  total: number;
}

/**
 * Collect engagement metrics for a single platform.
 */
async function collectPlatform(
  platform: string,
  fetcher: (postId: string) => Promise<{ views: number; likes: number; replies: number; reposts: number; quotes: number }>,
): Promise<CollectResult> {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: posts, error: postsError } = await supabaseAdmin
    .from('publish_log')
    .select('id, platform_post_id')
    .eq('platform', platform)
    .eq('status', 'published')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error(`[cron/engagement-collect] DB error fetching ${platform} posts:`, postsError);
    return { platform, collected: 0, failed: 0, total: 0 };
  }

  if (!posts || posts.length === 0) {
    return { platform, collected: 0, failed: 0, total: 0 };
  }

  const results = await Promise.allSettled(
    posts.map(async (post) => {
      const metrics = await fetcher(post.platform_post_id);

      const { error: insertError } = await supabaseAdmin
        .from('engagement_metrics')
        .insert({
          publish_log_id: post.id,
          platform,
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
          `[cron/engagement-collect] Insert error for ${platform}/${post.platform_post_id}:`,
          insertError,
        );
        throw insertError;
      }

      return post.platform_post_id;
    }),
  );

  const collected = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(
    `[cron/engagement-collect] ${platform}: ${collected}/${posts.length} (${failed} failed)`,
  );

  return { platform, collected, failed, total: posts.length };
}

/**
 * GET /api/cron/engagement-collect
 *
 * Vercel cron-compatible route that fetches engagement metrics
 * for recent posts (last 30 days) across configured platforms
 * and stores snapshots in the engagement_metrics table.
 *
 * Supported platforms: Threads, X/Twitter.
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

    const platformResults: CollectResult[] = [];

    // Collect Threads metrics if configured
    if (isThreadsConfigured()) {
      const threadsResult = await collectPlatform('threads', fetchThreadsInsights);
      platformResults.push(threadsResult);
    }

    // Collect X/Twitter metrics if configured
    if (getXClient()) {
      const xResult = await collectPlatform('x', fetchXInsights);
      platformResults.push(xResult);
    }

    if (platformResults.length === 0) {
      return NextResponse.json(
        { error: 'No platforms configured', collected: 0 },
        { status: 503 },
      );
    }

    const totalCollected = platformResults.reduce((sum, r) => sum + r.collected, 0);
    const totalFailed = platformResults.reduce((sum, r) => sum + r.failed, 0);
    const totalPosts = platformResults.reduce((sum, r) => sum + r.total, 0);

    return NextResponse.json({
      collected: totalCollected,
      failed: totalFailed,
      total: totalPosts,
      platforms: platformResults,
    });
  } catch (err) {
    console.error('[cron/engagement-collect] Error:', err);
    return NextResponse.json({ error: 'Engagement collection failed' }, { status: 500 });
  }
}
