import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForThreads } from '@/lib/publish/normalize';
import { publishToThreads, isThreadsConfigured } from '@/lib/publish/threads';
import { logger } from '@/lib/logger';

const publishThreadsSchema = z.object({
  castHash: z.string().min(1),
  text: z.string().min(1).max(1024),
  embedUrls: z.array(z.string().url()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  channel: z.string().optional(),
});

/**
 * POST — Cross-post content to Threads via the shared ZAO account.
 *
 * Admin-only. Validates input, normalizes content for Threads' 500-char limit,
 * publishes the post, and logs the result.
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

    // Check Threads is configured
    if (!isThreadsConfigured()) {
      return NextResponse.json(
        { error: 'Threads not configured' },
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
    const parsed = publishThreadsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { castHash, text, embedUrls, imageUrls, channel } = parsed.data;

    // Normalize content for Threads
    const normalized = normalizeForThreads({
      text,
      castHash,
      embedUrls,
      imageUrls,
      channel,
    });

    // Publish
    const result = await publishToThreads(normalized);

    // Log to publish_log table
    await supabaseAdmin
      .from('publish_log')
      .insert({
        platform: 'threads',
        cast_hash: castHash,
        platform_post_id: result.postId,
        platform_url: result.postUrl,
        published_by_fid: session.fid,
        text: normalized.text,
        status: 'published',
      });

    return NextResponse.json({
      success: true,
      platformUrl: result.postUrl,
    });
  } catch (err) {
    logger.error('[publish/threads] Error:', err);

    const message =
      err instanceof Error ? err.message : 'Failed to publish to Threads';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
