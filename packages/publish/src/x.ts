/**
 * X/Twitter publishing client.
 *
 * Uses OAuth 1.0a user-context auth with the shared ZAO app account.
 * Admin-only — the calling route must enforce access control.
 */

import { TwitterApi } from 'twitter-api-v2';
import type { SendTweetV2Params } from 'twitter-api-v2';
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

export interface XThreadResult {
  tweetIds: string[];
  tweetUrls: string[];
  headTweetId: string;
  headTweetUrl: string;
}

export interface XPublishOptions {
  /** ISO 8601 datetime for scheduled publishing (requires Basic+ tier). */
  scheduledAt?: string;
  /** Reply to this tweet ID (used internally for thread chaining). */
  replyToTweetId?: string;
}

/**
 * Upload images via v1.1 media endpoint and return media IDs.
 */
async function uploadImages(
  client: TwitterApi,
  imageUrls: string[],
): Promise<string[]> {
  const mediaIds: string[] = [];
  const imagesToUpload = imageUrls.slice(0, 4);

  for (const imageUrl of imagesToUpload) {
    const mediaId = await client.v1.uploadMedia(imageUrl, {
      additionalOwners: undefined,
    });
    mediaIds.push(mediaId);
  }

  return mediaIds;
}

/**
 * Publish a tweet from normalized content.
 *
 * - If `content.images` has URLs, uploads each via v1.1 media endpoint and
 *   attaches the resulting media_ids to the tweet.
 * - Supports optional `scheduledAt` for scheduled publishing (Basic+ tier).
 * - Returns the tweet ID and public URL.
 */
export async function publishToX(
  content: NormalizedContent,
  options?: XPublishOptions,
): Promise<XPublishResult> {
  const client = getXClient();
  if (!client) {
    throw new Error('X client not configured — missing env vars');
  }

  try {
    const mediaIds = content.images.length > 0
      ? await uploadImages(client, content.images)
      : [];

    // Build tweet payload
    const tweetPayload: SendTweetV2Params = { text: content.text };

    if (mediaIds.length > 0) {
      tweetPayload.media = {
        media_ids: mediaIds as SendTweetV2Params['media'] extends { media_ids?: infer T } ? NonNullable<T> : never,
      };
    }

    if (options?.replyToTweetId) {
      tweetPayload.reply = { in_reply_to_tweet_id: options.replyToTweetId };
    }

    // Note: X API scheduled_at requires Basic+ tier ($200/mo).
    // The field is included when provided but will fail on Free tier.
    if (options?.scheduledAt) {
      // twitter-api-v2 doesn't have a typed field for this yet —
      // pass it as an additional parameter via the raw v2 endpoint.
      const result = await client.v2.post('tweets', {
        ...tweetPayload,
        scheduled_at: options.scheduledAt,
      } as Record<string, unknown>);

      const data = result as unknown as { data: { id: string } };
      const tweetId = data.data.id;
      const tweetUrl = `https://x.com/thezao/status/${tweetId}`;
      return { tweetId, tweetUrl };
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

// ---------------------------------------------------------------------------
// Multi-tweet threads
// ---------------------------------------------------------------------------

const TWEET_MAX_LEN = 280;
const TCO_LENGTH = 23;

/**
 * Split text into tweet-sized chunks for a thread.
 * Breaks at word boundaries. First chunk reserves space for a t.co URL.
 * Subsequent chunks are standalone 280-char segments.
 */
export function splitIntoThread(
  text: string,
  castUrl: string,
): string[] {
  // First tweet reserves space for cast URL
  const firstMaxLen = TWEET_MAX_LEN - TCO_LENGTH - 1; // -1 for space before URL
  const subsequentMaxLen = TWEET_MAX_LEN;

  const chunks: string[] = [];
  let remaining = text;

  // First chunk with URL
  if (remaining.length <= firstMaxLen) {
    return [`${remaining} ${castUrl}`];
  }

  const firstBreak = remaining.lastIndexOf(' ', firstMaxLen);
  const firstCut = firstBreak > 0 ? firstBreak : firstMaxLen;
  chunks.push(`${remaining.slice(0, firstCut).trim()} ${castUrl}`);
  remaining = remaining.slice(firstCut).trim();

  // Subsequent chunks
  while (remaining.length > 0) {
    if (remaining.length <= subsequentMaxLen) {
      chunks.push(remaining);
      break;
    }

    const breakPoint = remaining.lastIndexOf(' ', subsequentMaxLen);
    const cut = breakPoint > 0 ? breakPoint : subsequentMaxLen;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  return chunks;
}

/**
 * Publish a multi-tweet thread from long-form content.
 *
 * Splits the text into 280-char chunks, posts them sequentially
 * using `reply.in_reply_to_tweet_id` to chain them.
 * Images are attached only to the first tweet.
 */
export async function publishThreadToX(
  content: NormalizedContent,
  options?: Pick<XPublishOptions, 'scheduledAt'>,
): Promise<XThreadResult> {
  const client = getXClient();
  if (!client) {
    throw new Error('X client not configured — missing env vars');
  }

  const chunks = splitIntoThread(content.text, content.castUrl);

  // If it fits in one tweet, just publish normally
  if (chunks.length === 1) {
    const result = await publishToX(
      { ...content, text: chunks[0] },
      options,
    );
    return {
      tweetIds: [result.tweetId],
      tweetUrls: [result.tweetUrl],
      headTweetId: result.tweetId,
      headTweetUrl: result.tweetUrl,
    };
  }

  const tweetIds: string[] = [];
  const tweetUrls: string[] = [];

  // Upload images once, attach to first tweet only
  const mediaIds = content.images.length > 0
    ? await uploadImages(client, content.images)
    : [];

  for (let i = 0; i < chunks.length; i++) {
    const isFirst = i === 0;
    const tweetPayload: SendTweetV2Params = { text: chunks[i] };

    if (isFirst && mediaIds.length > 0) {
      tweetPayload.media = {
        media_ids: mediaIds as SendTweetV2Params['media'] extends { media_ids?: infer T } ? NonNullable<T> : never,
      };
    }

    if (!isFirst) {
      tweetPayload.reply = { in_reply_to_tweet_id: tweetIds[i - 1] };
    }

    const result = await client.v2.tweet(tweetPayload);
    const tweetId = result.data.id;
    const tweetUrl = `https://x.com/thezao/status/${tweetId}`;

    tweetIds.push(tweetId);
    tweetUrls.push(tweetUrl);
  }

  return {
    tweetIds,
    tweetUrls,
    headTweetId: tweetIds[0],
    headTweetUrl: tweetUrls[0],
  };
}
