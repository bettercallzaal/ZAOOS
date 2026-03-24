import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { postCast } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { sendMessageSchema } from '@/lib/validation/schemas';
import { sendNotification, createInAppNotification } from '@/lib/notifications';
import { postToBluesky } from '@/lib/bluesky/client';
import { extractAndSaveSongs } from '@/lib/music/library';
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

    const { text, parentHash, embedHash, embedFid, embedUrls, channel, crossPostChannels, crossPostBluesky, crossPostLens, crossPostX, crossPostHive } = parsed.data;
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

    // Save any music links to the song library (fire and forget)
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

    // Cross-post to user's personal Bluesky (fire and forget)
    // Community @thezao account is governance-gated — only posts when proposals pass 1000 Respect threshold
    if (crossPostBluesky && !parentHash) {
      (async () => {
        try {
          const { data: bskyUser } = await supabaseAdmin
            .from('users')
            .select('bluesky_handle, bluesky_app_password')
            .eq('fid', session.fid)
            .single();

          if (bskyUser?.bluesky_handle && bskyUser?.bluesky_app_password) {
            await postToBluesky(text, 'https://zaoos.com/chat', {
              handle: bskyUser.bluesky_handle,
              appPassword: bskyUser.bluesky_app_password,
            });
          }
        } catch (err) {
          console.error('[bluesky/personal]', err);
        }
      })();
    }

    // Lens and Hive deferred — see research/121
    // Cross-post to Lens disabled (UI hidden, code preserved for future use)
    // if (crossPostLens && !parentHash) {
    //   (async () => {
    //     try {
    //       const { data: lensUser } = await supabaseAdmin
    //         .from('users')
    //         .select('lens_profile_id, lens_access_token, lens_refresh_token')
    //         .eq('fid', session.fid)
    //         .single();
    //
    //       if (lensUser?.lens_access_token) {
    //         const { normalizeForLens } = await import('@/lib/publish/normalize');
    //         const { publishToLens } = await import('@/lib/publish/lens');
    //         const content = normalizeForLens({ text, castHash: castData?.hash || '', embedUrls, channel });
    //         const result = await publishToLens(lensUser.lens_access_token, lensUser.lens_refresh_token || '', content, lensUser.lens_profile_id || undefined);
    //         console.info('[cross-post] Lens success:', result.postUrl);
    //
    //         await supabaseAdmin.from('publish_log').insert({
    //           cast_hash: castData?.hash,
    //           fid: session.fid,
    //           platform: 'lens',
    //           status: 'success',
    //           platform_post_id: result.postId,
    //           platform_url: result.postUrl,
    //         });
    //       } else {
    //         console.info('[cross-post] Lens skipped — no access token');
    //       }
    //     } catch (e) {
    //       console.error('[cross-post] Lens failed:', e);
    //       await supabaseAdmin.from('publish_log').insert({
    //         cast_hash: castData?.hash,
    //         fid: session.fid,
    //         platform: 'lens',
    //         status: 'failed',
    //         error_message: e instanceof Error ? e.message : 'Unknown error',
    //       });
    //     }
    //   })();
    // }

    // Cross-post to X — admin only (fire and forget — direct call)
    if (crossPostX && !parentHash && session.isAdmin) {
      (async () => {
        try {
          const { normalizeForX } = await import('@/lib/publish/normalize');
          const { publishToX, getXClient } = await import('@/lib/publish/x');
          const client = getXClient();
          if (!client) { console.info('[cross-post] X skipped — not configured'); return; }
          const content = normalizeForX({ text, castHash: castData?.hash || '', embedUrls, channel });
          const result = await publishToX(content);
          console.info('[cross-post] X success:', result.tweetUrl);
          await supabaseAdmin.from('publish_log').insert({
            cast_hash: castData?.hash, fid: session.fid, platform: 'x',
            status: 'success', platform_post_id: result.tweetId, platform_url: result.tweetUrl,
          });
        } catch (e) {
          console.error('[cross-post] X failed:', e);
        }
      })();
    }

    // Cross-post to Hive disabled (UI hidden, code preserved for future use)
    // Lens and Hive deferred — see research/121
    // if (crossPostHive && !parentHash) {
    //   (async () => {
    //     try {
    //       const { data: hiveUser } = await supabaseAdmin
    //         .from('users')
    //         .select('hive_username, hive_posting_key_encrypted')
    //         .eq('fid', session.fid)
    //         .single();
    //
    //       if (hiveUser?.hive_username && hiveUser?.hive_posting_key_encrypted) {
    //         const { normalizeForHive } = await import('@/lib/publish/normalize');
    //         const { publishToHive, decryptPostingKey } = await import('@/lib/publish/hive');
    //         const postingKey = decryptPostingKey(hiveUser.hive_posting_key_encrypted);
    //         const content = normalizeForHive({ text, castHash: castData?.hash || '', embedUrls, channel });
    //         const result = await publishToHive(hiveUser.hive_username, postingKey, content);
    //         console.info('[cross-post] Hive success:', result.url);
    //         await supabaseAdmin.from('publish_log').insert({
    //           cast_hash: castData?.hash, fid: session.fid, platform: 'hive',
    //           status: 'success', platform_url: result.url,
    //         });
    //       } else {
    //         console.info('[cross-post] Hive skipped — not connected');
    //       }
    //     } catch (e) {
    //       console.error('[cross-post] Hive failed:', e);
    //     }
    //   })();
    // }

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
