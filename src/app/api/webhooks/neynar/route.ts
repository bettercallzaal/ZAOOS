import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { communityConfig } from '@/../community.config';
import { isMusicUrl } from '@/lib/music/isMusicUrl';

const WATCHED_CHANNELS: readonly string[] = communityConfig.farcaster.channels;

// Extract channel ID from Neynar cast object.
// Neynar sets `channel.id` on casts in a channel, with parent_url as fallback.
function extractChannelId(cast: Record<string, unknown>): string | null {
  const channel = cast.channel as { id?: string } | null | undefined;
  if (channel?.id) return channel.id;

  const parentUrl = cast.parent_url as string | null | undefined;
  if (parentUrl) {
    const m = parentUrl.match(/\/channel\/([^/?#\s]+)/);
    if (m) return m[1];
  }
  return null;
}

function castToRow(cast: Record<string, unknown>, channelId: string) {
  const author = (cast.author ?? {}) as Record<string, unknown>;
  const reactions = (cast.reactions ?? {}) as Record<string, unknown>;
  const replies = (cast.replies ?? {}) as Record<string, unknown>;
  return {
    hash: cast.hash as string,
    channel_id: channelId,
    fid: author.fid as number,
    author_username: (author.username as string) || '',
    author_display: (author.display_name as string) || '',
    author_pfp: (author.pfp_url as string) || '',
    text: (cast.text as string) || '',
    timestamp: cast.timestamp as string,
    embeds: (cast.embeds as unknown[]) ?? [],
    reactions: {
      likes_count: (reactions.likes_count as number) ?? 0,
      recasts_count: (reactions.recasts_count as number) ?? 0,
      likes: (reactions.likes as { fid: number }[]) ?? [],
      recasts: (reactions.recasts as { fid: number }[]) ?? [],
    },
    replies_count: (replies.count as number) ?? 0,
    parent_hash: (cast.parent_hash as string) || null,
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify HMAC-SHA512 signature — reject if secret not configured
  const secret = ENV.NEYNAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] NEYNAR_WEBHOOK_SECRET not configured — rejecting request');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const sig = req.headers.get('X-Neynar-Signature') ?? '';
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const sigBuffer = Buffer.from(sig, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only handle new casts
  if (payload.type !== 'cast.created') {
    return NextResponse.json({ ok: true });
  }

  const cast = payload.data as Record<string, unknown>;
  const channelId = extractChannelId(cast);

  // Ignore casts not in our watched channels
  if (!channelId || !WATCHED_CHANNELS.includes(channelId)) {
    return NextResponse.json({ ok: true });
  }

  // Cache both top-level posts and replies for thread views
  // parent_hash is set for replies, null for top-level channel posts

  try {
    const row = castToRow(cast, channelId);
    await supabaseAdmin
      .from('channel_casts')
      .upsert(row, { onConflict: 'hash' });
  } catch (err) {
    console.error('[webhook/neynar] DB insert error:', err);
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
  }

  // ── Auto-detect music links and add to song_submissions ──────────
  try {
    const castText = (cast.text as string) || '';
    const embeds = (cast.embeds as { url?: string }[]) ?? [];

    // Collect all URLs from text and embeds
    const urlsInText = castText.match(/https?:\/\/[^\s)]+/g) || [];
    const embedUrls = embeds.map((e) => e.url).filter(Boolean) as string[];
    const allUrls = [...new Set([...urlsInText, ...embedUrls])];

    for (const url of allUrls) {
      const trackType = isMusicUrl(url);
      if (!trackType) continue;

      const author = (cast.author ?? {}) as Record<string, unknown>;

      // Check for duplicate URL before inserting
      const { data: existing } = await supabaseAdmin
        .from('song_submissions')
        .select('id')
        .eq('url', url)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Extract a title from the cast text (first line or truncated)
      const titleFromText = castText
        .replace(/https?:\/\/[^\s)]+/g, '')
        .trim()
        .slice(0, 200) || 'Shared track';

      const insertRow: Record<string, unknown> = {
        url,
        title: titleFromText,
        artist: (author.display_name as string) || (author.username as string) || null,
        track_type: trackType,
        channel: channelId,
        submitted_by_fid: author.fid as number,
        submitted_by_username: (author.username as string) || '',
        submitted_by_display: (author.display_name as string) || '',
        source: 'auto',
      };

      // Try with source column, fall back without if column doesn't exist
      let result = await supabaseAdmin
        .from('song_submissions')
        .insert(insertRow);

      if (result.error && result.error.message?.includes('source')) {
        delete insertRow.source;
        result = await supabaseAdmin
          .from('song_submissions')
          .insert(insertRow);
      }

      if (result.error) {
        console.error('[webhook/neynar] Auto-submit music link error:', result.error);
      }
    }
  } catch (err) {
    // Non-fatal: log but don't fail the webhook
    console.error('[webhook/neynar] Auto-detect music error:', err);
  }

  return NextResponse.json({ ok: true });
}
