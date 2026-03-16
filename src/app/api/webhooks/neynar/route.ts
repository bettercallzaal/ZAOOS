import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

const WATCHED_CHANNELS = ['zao', 'zabal', 'coc'];

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

  // Verify HMAC-SHA512 signature when secret is configured
  const secret = ENV.NEYNAR_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get('X-Neynar-Signature') ?? '';
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (sig !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
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

  // Ignore replies (parent_hash set = reply to a cast, not a top-level channel post)
  // Top-level channel posts have parent_hash = null, parent_url = channel URL
  if (cast.parent_hash) {
    return NextResponse.json({ ok: true });
  }

  try {
    const row = castToRow(cast, channelId);
    await supabaseAdmin
      .from('channel_casts')
      .upsert(row, { onConflict: 'hash' });
  } catch (err) {
    console.error('[webhook/neynar] DB insert error:', err);
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
