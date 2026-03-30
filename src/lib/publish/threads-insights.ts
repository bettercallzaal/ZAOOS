/**
 * Threads Insights API client.
 *
 * Fetches engagement metrics for published Threads posts using the
 * Meta Graph API v1.0 Insights endpoint.
 *
 * Requires `threads_manage_insights` permission on the Meta Business App.
 * Metrics available: views, likes, replies, reposts, quotes, shares.
 *
 * @see https://developers.facebook.com/docs/threads/insights
 */

import { ENV } from '@/lib/env';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

export interface ThreadsMetrics {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}

/**
 * Fetch engagement metrics for a single Threads post.
 *
 * Returns zeroed metrics if the API call fails (e.g. post deleted,
 * insufficient permissions) so the caller can handle gracefully.
 */
export async function fetchThreadsInsights(
  threadId: string,
): Promise<ThreadsMetrics> {
  const { THREADS_ACCESS_TOKEN } = ENV;

  if (!THREADS_ACCESS_TOKEN) {
    throw new Error('Threads not configured — missing THREADS_ACCESS_TOKEN');
  }

  const params = new URLSearchParams({
    metric: 'views,likes,replies,reposts,quotes',
    access_token: THREADS_ACCESS_TOKEN,
  });

  const res = await fetch(
    `${THREADS_API_BASE}/${threadId}/insights?${params.toString()}`,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    console.error(`[threads-insights] Failed for ${threadId}: ${msg}`);
    return { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 };
  }

  const body = (await res.json()) as {
    data: Array<{ name: string; values: Array<{ value: number }> }>;
  };

  const metrics: ThreadsMetrics = {
    views: 0,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
  };

  for (const metric of body.data || []) {
    const value = metric.values?.[0]?.value ?? 0;
    if (metric.name in metrics) {
      metrics[metric.name as keyof ThreadsMetrics] = value;
    }
  }

  return metrics;
}
