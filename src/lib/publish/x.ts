/**
 * X/Twitter publishing client.
 *
 * Uses OAuth 1.0a user-context auth with the shared ZAO app account.
 * Admin-only — the calling route must enforce access control.
 */

import { TwitterApi } from 'twitter-api-v2';
import { ENV } from '@/lib/env';
import { NormalizedContent } from '@/lib/publish/normalize';

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Create an authenticated TwitterApi client using OAuth 1.0a credentials.
 * Returns null if any of the four required env vars are missing.
 */
export function getXClient(): TwitterApi | null {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = ENV;

  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    return null;
  }

  const client = new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });

  return client;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export interface XPublishResult {
  tweetId: string;
  tweetUrl: string;
}

/**
 * Publish a tweet from normalized content.
 *
 * - If `content.images` has URLs, uploads each via v1.1 media endpoint and
 *   attaches the resulting media_ids to the tweet.
 * - Returns the tweet ID and public URL.
 */
export async function publishToX(
  content: NormalizedContent,
): Promise<XPublishResult> {
  const client = getXClient();
  if (!client) {
    throw new Error('X client not configured — missing env vars');
  }

  try {
    // Upload images if present (max 4 per tweet)
    const mediaIds: string[] = [];
    if (content.images.length > 0) {
      const imagesToUpload = content.images.slice(0, 4);

      for (const imageUrl of imagesToUpload) {
        const mediaId = await client.v1.uploadMedia(imageUrl, {
          additionalOwners: undefined,
        });
        mediaIds.push(mediaId);
      }
    }

    // Build tweet payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tweetPayload: any = { text: content.text };

    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }

    const result = await client.v2.tweet(tweetPayload);

    const tweetId = result.data.id;
    const tweetUrl = `https://x.com/thezao/status/${tweetId}`;

    return { tweetId, tweetUrl };
  } catch (err: unknown) {
    // Handle rate limit errors gracefully
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: number }).code === 429
    ) {
      const rateLimitErr = err as { rateLimit?: { reset?: number } };
      const resetAt = rateLimitErr.rateLimit?.reset;
      const resetDate = resetAt ? new Date(resetAt * 1000).toISOString() : 'unknown';
      throw new Error(
        `X API rate limit exceeded. Resets at ${resetDate}`,
      );
    }

    throw err;
  }
}
