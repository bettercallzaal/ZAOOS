import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { postCast } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { sendMessageSchema } from '@/lib/validation/schemas';
import { sendNotification, createInAppNotification } from '@/lib/notifications';

import { extractAndSaveSongs } from '@/lib/music/library';
import { touchActivity } from '@/lib/db/activity';
import { communityConfig } from '@/../community.config';

const ALLOWED_CHANNELS: readonly string[] = communityConfig.farcaster.channels;

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.signerUuid) {
    return NextResponse.json({ error: 'No signer configured. Please approve a signer first.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { text, parentHash, embedHash, embedFid, embedUrls, channel, crossPostChannels } = parsed.data;
    const primaryChannel = channel && ALLOWED_CHANNELS.includes(channel) ? channel : 'zao';

    // Build list of channels to post to
    const channels = new Set([primaryChannel]);
    if (crossPostChannels) {
      for (const ch of crossPostChannels) {
        if (ALLOWED_CHANNELS.includes(ch)) channels.add(ch);
      }
    }

    // Post to primary channel first
    const result = await postCast(session.signerUuid, text, primaryChannel, parentHash, embedHash, embedUrls, embedFid);

    // Write the new cast to our DB immediately so it shows up on next fetch
    const castData = result.cast;
    if (castData?.hash) {
      const row = {
        hash: castData.hash,
        channel_id: primaryChannel,
        fid: session.fid,
        author_username: session.username,
        author_display: session.displayName,
        author_pfp: session.pfpUrl,
        text,
        timestamp: new Date().toISOString(),
        embeds: castData.embeds ?? [],
        reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
        replies_count: 0,
        parent_hash: parentHash ?? null,
      };

      const { error: dbError } = await supabaseAdmin
        .from('channel_casts')
        .upsert([row], { onConflict: 'hash' });
      if (dbError) console.error('[send] DB insert error:', dbError);
    }

    // Track member activity + save music links (fire and forget)
    touchActivity(session.fid);
    extractAndSaveSongs(text, embedUrls, session.fid, 'chat').catch(() => {});

    // Cross-post to additional channels (fire and forget)
    const additionalChannels = [...channels].filter((ch) => ch !== primaryChannel);
    if (additionalChannels.length > 0) {
      await Promise.allSettled(
        additionalChannels.map(async (ch) => {
          const crossResult = await postCast(session.signerUuid!, text, ch, undefined, embedHash, embedUrls, embedFid);
          // Also write cross-posts to DB
          if (crossResult.cast?.hash) {
            await supabaseAdmin
              .from('channel_casts')
              .upsert([{
                hash: crossResult.cast.hash,
                channel_id: ch,
                fid: session.fid,
                author_username: session.username,
                author_display: session.displayName,
                author_pfp: session.pfpUrl,
                text,
                timestamp: new Date().toISOString(),
                embeds: crossResult.cast.embeds ?? [],
                reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
                replies_count: 0,
                parent_hash: null,
              }], { onConflict: 'hash' });
          }
        })
      ).catch((err) => console.error('[notify]', err));
    }

    // Cross-post to Telegram and Discord (fire and forget, non-blocking)
    // Only if env vars are set — skip silently otherwise
    if (castData?.hash) {
      Promise.allSettled([
        // Telegram
        (async () => {
          if (!process.env.TELEGRAM_BOT_TOKEN) return;
          const { normalizeForTelegram } = await import('@/lib/publish/normalize');
          const { publishToTelegram, escapeMarkdownV2 } = await import('@/lib/publish/telegram');
          const farcasterLink = `https://warpcast.com/~/conversations/${castData.hash}`;
          const normalized = normalizeForTelegram({
            text: `${session.displayName} in #${primaryChannel}:\n\n${text}\n\n🔗 View on Farcaster: ${farcasterLink}\n🌐 Join ZAO OS: https://zaoos.com`,
            castHash: castData.hash,
          });
          const result = await publishToTelegram({
            text: escapeMarkdownV2(normalized.text),
          });
          if (!result.success) {
            console.error('[chat/send] Telegram cross-post failed:', result.error);
          }
        })(),
        // Discord
        (async () => {
          if (!process.env.DISCORD_WEBHOOK_URL) return;
          const { normalizeForDiscord } = await import('@/lib/publish/normalize');
          const { publishToDiscord, buildZaoEmbed } = await import('@/lib/publish/discord');
          const normalized = normalizeForDiscord({
            text,
            castHash: castData.hash,
          });
          const farcasterLink = `https://warpcast.com/~/conversations/${castData.hash}`;
          const embed = buildZaoEmbed({
            title: `#${primaryChannel}`,
            description: `${normalized.text}\n\n[View on Farcaster](${farcasterLink}) · [Join ZAO OS](https://zaoos.com)`,
            url: farcasterLink,
            footerText: `${session.displayName} via ZAO OS`,
          });
          const result = await publishToDiscord({
            text: '',
            embeds: [embed],
            username: 'ZAO OS',
          });
          if (!result.success) {
            console.error('[chat/send] Discord cross-post failed:', result.error);
          }
        })(),
      ]).catch((err) => console.error('[chat/send] Cross-post error:', err));
    }

    // Send push + in-app notifications (fire and forget)
    const channelList = [...channels].map((c) => `#${c}`).join(', ');
    const preview = text.length > 80 ? text.slice(0, 80) + '...' : text;
    sendNotification(
      `${session.displayName} in ${channelList}`,
      preview,
      `https://zaoos.com/chat`,
      `msg-${Date.now()}-${session.fid}`,
      session.fid // exclude sender
    ).catch((err) => console.error('[notify]', err));

    // In-app notification for all other active members
    Promise.resolve(
      supabaseAdmin
        .from('users')
        .select('fid')
        .eq('is_active', true)
        .neq('fid', session.fid)
    ).then(({ data: members }) => {
      if (members?.length) {
        createInAppNotification({
          recipientFids: members.map((m) => m.fid).filter(Boolean),
          type: 'message',
          title: `${session.displayName} in ${channelList}`,
          body: preview,
          href: '/chat',
          actorFid: session.fid,
          actorDisplayName: session.displayName,
          actorPfpUrl: session.pfpUrl,
        }).catch((err) => console.error('[notify]', err));
      }
    }).catch((err) => console.error('[notify]', err));

    return NextResponse.json({
      success: true,
      cast: result.cast,
      crossPosted: additionalChannels,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
