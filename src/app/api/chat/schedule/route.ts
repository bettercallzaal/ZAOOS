import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { postCast } from '@/lib/farcaster/neynar';
import { communityConfig } from '@/../community.config';

const ALLOWED_CHANNELS: readonly string[] = communityConfig.farcaster.channels;

const scheduleSchema = z.object({
  text: z.string().min(1).max(1024),
  channel: z.string().min(1),
  scheduledFor: z.string().datetime(),
  embedHash: z.string().regex(/^0x[a-f0-9]{40}$/).optional(),
  embedUrls: z.array(z.string().url()).max(2).optional(),
  crossPostChannels: z.array(z.string()).optional(),
});

// GET: list user's scheduled casts
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('scheduled_casts')
    .select('*')
    .eq('fid', session.fid)
    .in('status', ['pending', 'failed'])
    .order('scheduled_for', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  return NextResponse.json({ scheduled: data || [] });
}

// POST: create a scheduled cast
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Unauthorized or no signer' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { text, channel, scheduledFor, embedHash, embedUrls, crossPostChannels } = parsed.data;

    const scheduleDate = new Date(scheduledFor);
    if (scheduleDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }

    // Validate channel and crossPostChannels against allowed channels
    const primaryChannel = ALLOWED_CHANNELS.includes(channel) ? channel : 'zao';

    const { data, error } = await supabaseAdmin
      .from('scheduled_casts')
      .insert({
        fid: session.fid,
        text,
        channel_id: primaryChannel,
        scheduled_for: scheduleDate.toISOString(),
        embed_hash: embedHash || null,
        embed_urls: embedUrls || [],
        cross_post_channels: crossPostChannels?.filter((ch: string) => ALLOWED_CHANNELS.includes(ch)) || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[schedule] insert error:', error);
      return NextResponse.json({ error: 'Failed to schedule' }, { status: 500 });
    }

    return NextResponse.json({ scheduled: data });
  } catch (error) {
    console.error('[schedule] error:', error);
    return NextResponse.json({ error: 'Failed to schedule' }, { status: 500 });
  }
}

// DELETE: cancel a scheduled cast
export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('scheduled_casts')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('fid', session.fid)
    .eq('status', 'pending');

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH: process due scheduled casts (called by cron or on page load)
export async function PATCH() {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find due casts for this user
    const { data: dueCasts } = await supabaseAdmin
      .from('scheduled_casts')
      .select('*')
      .eq('fid', session.fid)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5);

    if (!dueCasts || dueCasts.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;

    for (const cast of dueCasts) {
      try {
        await postCast(
          session.signerUuid,
          cast.text,
          cast.channel_id,
          undefined,
          cast.embed_hash || undefined,
          cast.embed_urls?.length > 0 ? cast.embed_urls : undefined
        );

        // Cross-post
        if (cast.cross_post_channels?.length > 0) {
          await Promise.allSettled(
            cast.cross_post_channels.map((ch: string) =>
              postCast(session.signerUuid!, cast.text, ch, undefined, cast.embed_hash || undefined, cast.embed_urls?.length > 0 ? cast.embed_urls : undefined)
            )
          );
        }

        await supabaseAdmin
          .from('scheduled_casts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', cast.id);

        processed++;
      } catch (err) {
        await supabaseAdmin
          .from('scheduled_casts')
          .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' })
          .eq('id', cast.id);
      }
    }

    return NextResponse.json({ processed });
  } catch (error) {
    console.error('[schedule] process error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
