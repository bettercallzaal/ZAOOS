/**
 * X/Twitter engagement metrics fetcher.
 *
 * Uses the v2 tweets endpoint with `tweet.fields=public_metrics` to
 * retrieve impressions, likes, retweets, replies, quotes, and bookmarks.
 *
 * Works on the Free tier (read access for owned tweets).
 *
 * @see https://developer.x.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id
 */

import { getXClient } from '@/lib/publish/x';

export interface XMetrics {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  bookmarks: number;
}

/**
 * Fetch engagement metrics for a single tweet by ID.
 *
 * Returns zeroed metrics if the API call fails (e.g. tweet deleted,
 * insufficient permissions) so the caller can handle gracefully.
 */
export async function fetchXInsights(tweetId: string): Promise<XMetrics> {
  const client = getXClient();

  if (!client) {
    throw new Error('X client not configured — missing env vars');
  }

  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics'],
    });

    const pm = tweet.data.public_metrics;

    if (!pm) {
      console.warn(`[x-insights] No public_metrics for tweet ${tweetId}`);
      return zeroed();
    }

    return {
      views: pm.impression_count ?? 0,
      likes: pm.like_count ?? 0,
      replies: pm.reply_count ?? 0,
      reposts: pm.retweet_count ?? 0,
      quotes: pm.quote_count ?? 0,
      bookmarks: pm.bookmark_count ?? 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[x-insights] Failed for tweet ${tweetId}: ${msg}`);
    return zeroed();
  }
}

function zeroed(): XMetrics {
  return { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, bookmarks: 0 };
}
