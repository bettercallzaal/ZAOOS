import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForTelegram } from '@/lib/publish/normalize';
import { publishToTelegram } from '@/lib/publish/telegram';
import { logger } from '@/lib/logger';

const publishTelegramSchema = z.object({
  text: z.string().min(1).max(4096),
  imageUrl: z.string().url().optional(),
  chatId: z.string().optional(),
  castHash: z.string().optional(),
  channel: z.string().optional(),
});

/**
 * POST — Publish content to a Telegram chat/channel via the ZAO bot.
 *
 * Authenticated users only. Validates input, normalizes content for Telegram,
 * publishes the message, and logs the result.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check Telegram is configured
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Telegram not configured' },
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
    const parsed = publishTelegramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { text, imageUrl, chatId, castHash, channel } = parsed.data;

    // Normalize content for Telegram if castHash is provided
    let normalizedText = text;
    if (castHash) {
      const normalized = normalizeForTelegram({
        text,
        castHash,
        channel,
      });
      normalizedText = normalized.text;
    }

    // Publish
    const result = await publishToTelegram({
      text: normalizedText,
      imageUrl,
      chatId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 },
      );
    }

    // Log to publish_log table
    await supabaseAdmin
      .from('publish_log')
      .insert({
        platform: 'telegram',
        cast_hash: castHash || null,
        platform_post_id: result.messageId ? String(result.messageId) : null,
        published_by_fid: session.fid,
        text: normalizedText,
        status: 'published',
      });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (err) {
    logger.error('[publish/telegram] Error:', err);

    const message =
      err instanceof Error ? err.message : 'Failed to publish to Telegram';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
