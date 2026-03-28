import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeForDiscord } from '@/lib/publish/normalize';
import { publishToDiscord, buildZaoEmbed } from '@/lib/publish/discord';

const publishDiscordSchema = z.object({
  text: z.string().min(1).max(2000),
  title: z.string().max(256).optional(),
  imageUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  castHash: z.string().optional(),
  channel: z.string().optional(),
});

/**
 * POST — Publish content to Discord via webhook.
 *
 * Authenticated users only. Validates input, normalizes content for Discord,
 * optionally builds a ZAO-branded embed, publishes the message, and logs the result.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Discord is configured (env var or will be provided in body)
    // We check after parsing so webhookUrl override can satisfy this
    const hasEnvWebhook = !!process.env.DISCORD_WEBHOOK_URL;

    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate input
    const parsed = publishDiscordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { text, title, imageUrl, webhookUrl, castHash, channel } = parsed.data;

    // Ensure at least one webhook source is available
    if (!hasEnvWebhook && !webhookUrl) {
      return NextResponse.json(
        { error: 'Discord not configured — no webhook URL available' },
        { status: 503 },
      );
    }

    // Normalize content for Discord if castHash is provided
    let normalizedText = text;
    if (castHash) {
      const normalized = normalizeForDiscord({
        text,
        castHash,
        channel,
      });
      normalizedText = normalized.text;
    }

    // Build ZAO-branded embed if title is provided
    const embeds = title
      ? [buildZaoEmbed({
          title,
          description: normalizedText,
          imageUrl,
        })]
      : undefined;

    // Publish
    const result = await publishToDiscord({
      text: normalizedText,
      embeds,
      webhookUrl,
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
        platform: 'discord',
        cast_hash: castHash || null,
        platform_post_id: result.messageId || null,
        published_by_fid: session.fid,
        text: normalizedText,
        status: 'published',
      });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[publish/discord] Error:', err);

    const message =
      err instanceof Error ? err.message : 'Failed to publish to Discord';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
