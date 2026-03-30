import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForX } from '@/lib/publish/normalize';
import { publishToX, publishThreadToX, getXClient } from '@/lib/publish/x';
import { logger } from '@/lib/logger';

const publishXSchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1).max(4096),
  embedUrls: z.array(z.string().url()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  channel: z.string().optional(),
  /** ISO 8601 datetime for scheduled publishing (requires Basic+ tier). */
  scheduledAt: z.string().datetime().optional(),
  /** When true, long text is split into a multi-tweet thread. */
  thread: z.boolean().optional(),
});

/**
 * POST — Cross-post content to X/Twitter via the shared ZAO account.
 *
 * Admin-only. Validates input, normalizes content for X's 280-char limit,
 * publishes the tweet (or thread), and logs the result.
 *
 * Supports:
 * - `scheduledAt` for scheduled publishing (requires Basic+ tier)
 * - `thread: true` for long-form content that exceeds 280 chars
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    // Check X is configured
    const client = getXClient();
    if (!client) {
      return NextResponse.json(
        { error: 'X not configured' },
        { status: 503 },
      );
    }

    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate input
    const parsed = publishXSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { castHash, text, embedUrls, imageUrls, channel, scheduledAt, thread } = parsed.data;

    // Normalize content for X
    const normalized = normalizeForX({
      text,
      castHash,
      embedUrls,
      imageUrls,
      channel,
    });

    // Thread mode: split long content into multiple tweets
    if (thread) {
      const threadResult = await publishThreadToX(normalized, { scheduledAt });

      // Log the head tweet
      await supabaseAdmin
        .from('publish_log')
        .insert({
          platform: 'x',
          cast_hash: castHash,
          platform_post_id: threadResult.headTweetId,
          platform_url: threadResult.headTweetUrl,
          published_by_fid: session.fid,
          text: normalized.text,
          status: scheduledAt ? 'scheduled' : 'published',
        });

      return NextResponse.json({
        success: true,
        platformUrl: threadResult.headTweetUrl,
        thread: {
          tweetCount: threadResult.tweetIds.length,
          tweetUrls: threadResult.tweetUrls,
        },
      });
    }

    // Single tweet mode
    const result = await publishToX(normalized, { scheduledAt });

    // Log to publish_log table
    await supabaseAdmin
      .from('publish_log')
      .insert({
        platform: 'x',
        cast_hash: castHash,
        platform_post_id: result.tweetId,
        platform_url: result.tweetUrl,
        published_by_fid: session.fid,
        text: normalized.text,
        status: scheduledAt ? 'scheduled' : 'published',
      });

    return NextResponse.json({
      success: true,
      platformUrl: result.tweetUrl,
      ...(scheduledAt && { scheduledAt }),
    });
  } catch (err) {
    logger.error('[publish/x] Error:', err);

    const message =
      err instanceof Error ? err.message : 'Failed to publish to X';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
