import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatEther } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
import { proposalVoteSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

const OG_RESPECT = '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as const;
const ZOR_RESPECT = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as const;
const ZOR_TOKEN_ID = BigInt(0);

const ogAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
const zorAbi = parseAbi(['function balanceOf(address, uint256) view returns (uint256)']);

/**
 * POST — Vote on a proposal
 * Body: { proposal_id, vote: 'for' | 'against' | 'abstain' }
 * Vote weight = user's current on-chain OG + ZOR balance
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = proposalVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { proposal_id, vote } = parsed.data;

    // Fetch proposal and user in parallel (independent queries)
    const [proposalResult, userResult] = await Promise.all([
      supabaseAdmin
        .from('proposals')
        .select('status, closes_at')
        .eq('id', proposal_id)
        .single(),
      supabaseAdmin
        .from('users')
        .select('id, primary_wallet, respect_wallet')
        .eq('fid', session.fid)
        .single(),
    ]);

    const proposal = proposalResult.data;
    const user = userResult.data;

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'open') {
      return NextResponse.json({ error: 'Proposal is no longer open for voting' }, { status: 400 });
    }

    if (proposal.closes_at && new Date(proposal.closes_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Voting period has ended' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get on-chain respect balance for vote weight
    const wallet = (user.respect_wallet || user.primary_wallet) as `0x${string}`;
    let respectWeight = 0;

    if (wallet && !wallet.startsWith('fid:')) {
      const client = createPublicClient({
        chain: optimism,
        transport: http('https://mainnet.optimism.io'),
      });

      const [ogBalance, zorBalance] = await client.multicall({
        contracts: [
          { address: OG_RESPECT, abi: ogAbi, functionName: 'balanceOf', args: [wallet] },
          { address: ZOR_RESPECT, abi: zorAbi, functionName: 'balanceOf', args: [wallet, ZOR_TOKEN_ID] },
        ],
      });

      const og = ogBalance.status === 'success' ? Number(formatEther(ogBalance.result as bigint)) : 0;
      const zor = zorBalance.status === 'success' ? Number(zorBalance.result as bigint) : 0;
      respectWeight = Math.round(og + zor);
    }

    // Upsert vote (allows changing vote)
    const { data: voteData, error } = await supabaseAdmin
      .from('proposal_votes')
      .upsert(
        {
          proposal_id,
          voter_id: user.id,
          vote,
          respect_weight: respectWeight,
        },
        { onConflict: 'proposal_id,voter_id' }
      )
      .select()
      .single();

    if (error) {
      logger.error('[vote] upsert failed:', error);
      // If upsert fails due to missing constraint, try insert then update
      if (error.code === '42P10' || error.message?.includes('ON CONFLICT')) {
        // Fallback: check if vote exists, then update or insert
        const { data: existing } = await supabaseAdmin
          .from('proposal_votes')
          .select('id')
          .eq('proposal_id', proposal_id)
          .eq('voter_id', user.id)
          .maybeSingle();

        if (existing) {
          const { error: updateErr } = await supabaseAdmin
            .from('proposal_votes')
            .update({ vote, respect_weight: respectWeight })
            .eq('id', existing.id);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabaseAdmin
            .from('proposal_votes')
            .insert({ proposal_id, voter_id: user.id, vote, respect_weight: respectWeight });
          if (insertErr) throw insertErr;
        }
      } else {
        throw error;
      }
    }

    // Notify the proposal author about the vote (fire and forget)
    Promise.resolve(
      supabaseAdmin
        .from('proposals')
        .select('author_id, title, users!proposals_author_id_fkey(fid)')
        .eq('id', proposal_id)
        .single()
    ).then(({ data: p }) => {
      const authorFid = (p?.users as unknown as { fid: number } | null)?.fid;
      if (authorFid && authorFid !== session.fid) {
        createInAppNotification({
          recipientFids: [authorFid],
          type: 'vote',
          title: `Vote: ${vote}`,
          body: `${session.displayName} voted ${vote} on "${(p?.title as string || '').slice(0, 60)}"`,
          href: '/governance',
          actorFid: session.fid,
          actorDisplayName: session.displayName,
          actorPfpUrl: session.pfpUrl,
        }).catch((err) => logger.error('[notify]', err));
      }
    }).catch((err) => logger.error('[notify]', err));

    // Check if this vote pushed the proposal over the publish threshold
    // Must await — fire-and-forget gets killed by Vercel function timeout
    let published = false;
    if (vote === 'for') {
      try {
        published = await checkPublishThreshold(proposal_id);
      } catch (err) {
        logger.error('[publish-threshold]', err);
      }
    }

    const response: Record<string, unknown> = { vote: voteData, respectWeight, published };
    if (respectWeight === 0) {
      response.warning = 'Your vote was recorded but has zero weight. Earn Respect through fractal participation to increase your voting power.';
    }
    return NextResponse.json(response);
  } catch (err) {
    logger.error('Vote error:', err);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}

/**
 * Check if a proposal has reached the Respect vote threshold for auto-publishing
 * to @thezao Farcaster account. Non-blocking, fire-and-forget.
 */
async function checkPublishThreshold(proposalId: string): Promise<boolean> {
  // Get proposal with publish info
  const { data: proposal } = await supabaseAdmin
    .from('proposals')
    .select('id, publish_text, published_cast_hash, respect_threshold, status, closes_at, category')
    .eq('id', proposalId)
    .single();

  if (!proposal) return false;

  // Skip if already published
  if (proposal.published_cast_hash) return false;

  // Social posts publish immediately when threshold is met.
  // All other categories wait for the voting period to end.
  const isSocial = proposal.category === 'social';
  if (!isSocial && proposal.closes_at) {
    const deadline = new Date(proposal.closes_at).getTime();
    if (deadline > Date.now()) {
      return false;
    }
  }

  // Sum Respect-weighted FOR votes
  const { data: votes } = await supabaseAdmin
    .from('proposal_votes')
    .select('vote, respect_weight')
    .eq('proposal_id', proposalId);

  const totalRespectFor = (votes || [])
    .filter((v: { vote: string }) => v.vote === 'for')
    .reduce((sum: number, v: { respect_weight: number | null }) => sum + (v.respect_weight || 0), 0);

  const threshold = proposal.respect_threshold || 1000;

  if (totalRespectFor >= threshold) {
    console.info(`[publish-threshold] Proposal ${proposalId} reached ${totalRespectFor}/${threshold} Respect — auto-publishing`);

    const { data: fullProposal } = await supabaseAdmin
      .from('proposals')
      .select('*, author:users!proposals_author_id_fkey(display_name, username)')
      .eq('id', proposalId)
      .single();

    if (!fullProposal) return false;

    const authorName = fullProposal.author?.username || fullProposal.author?.display_name || 'ZAO member';
    // Use publish_text if set, otherwise title only (avoid duplicating if title === description)
    const publishText = fullProposal.publish_text
      || (fullProposal.title === fullProposal.description
        ? fullProposal.title
        : `${fullProposal.title}\n\n${fullProposal.description}`);
    const attribution = `\n\n— Proposed by @${authorName} • Approved by ZAO governance\nfrom zaoos.com`;

    let castHash: string | null = null;
    let fcError: string | null = null;
    let bskyUri: string | null = null;
    let bskyError: string | null = null;

    // Publish to Farcaster + Bluesky in parallel (independent of each other)
    const ENV = await import('@/lib/env').then((m) => m.ENV);
    const isWavewarz = fullProposal.category === 'wavewarz';
    const signerUuid = isWavewarz ? ENV.WAVEWARZ_OFFICIAL_SIGNER_UUID : ENV.ZAO_OFFICIAL_SIGNER_UUID;
    const neynarApiKey = isWavewarz ? ENV.WAVEWARZ_OFFICIAL_NEYNAR_API_KEY : ENV.ZAO_OFFICIAL_NEYNAR_API_KEY;
    const publishChannel = isWavewarz ? 'wavewarz' : 'zao';

    const [fcResult, bskyResult] = await Promise.allSettled([
      // Farcaster
      (async () => {
        if (!signerUuid) {
          throw new Error(`Signer not configured for /${publishChannel}`);
        }
        const { postCast } = await import('@/lib/farcaster/neynar');
        const maxLen = 1024 - attribution.length;
        const castText = publishText.length > maxLen
          ? publishText.slice(0, maxLen - 3) + '...' + attribution
          : publishText + attribution;

        const embedUrls = fullProposal.publish_image_url ? [fullProposal.publish_image_url] : undefined;

        const result = await postCast(
          signerUuid,
          castText,
          publishChannel,
          undefined,
          undefined,
          embedUrls,
          undefined,
          neynarApiKey,
        );
        return result?.cast?.hash || null;
      })(),

      // Bluesky
      (async () => {
        const { postToBluesky } = await import('@/lib/bluesky/client');
        return postToBluesky(
          publishText + attribution,
          'https://zaoos.com/governance',
        );
      })(),
    ]);

    // Extract Farcaster result
    if (fcResult.status === 'fulfilled') {
      castHash = fcResult.value;
      console.info(`[publish-threshold] Published to /${publishChannel}: ${castHash}`);
    } else {
      fcError = fcResult.reason instanceof Error ? fcResult.reason.message : 'Farcaster publish failed';
      if (fcError.includes('Signer not configured')) {
        logger.warn(`[publish-threshold] ${fcError}`);
      } else {
        logger.error('[publish-threshold] Farcaster publish failed:', fcError);
      }
    }

    // Extract Bluesky result
    if (bskyResult.status === 'fulfilled') {
      bskyUri = bskyResult.value;
      if (bskyUri) {
        console.info(`[publish-threshold] Published to @thezao Bluesky: ${bskyUri}`);
      }
    } else {
      bskyError = bskyResult.reason instanceof Error ? bskyResult.reason.message : 'Bluesky publish failed';
      logger.error('[publish-threshold] Bluesky publish failed:', bskyError);
    }

    // Publish to X, Telegram, and Discord in parallel (may use castHash from Farcaster)
    let xUrl: string | null = null;
    let xError: string | null = null;
    let threadsUrl: string | null = null;
    let threadsError: string | null = null;
    let telegramMessageId: number | null = null;
    let telegramError: string | null = null;
    let discordMessageId: string | null = null;
    let discordError: string | null = null;

    const parallelPublishResults = await Promise.allSettled([
      // X/Twitter
      (async () => {
        const { publishToX, getXClient } = await import('@/lib/publish/x');
        const client = getXClient();
        if (!client) {
          return { platform: 'x' as const, error: 'X not configured — add API keys in env vars' };
        }
        const xAttribution = `\n\n— Proposed by @${authorName} • Approved by ZAO governance\nfrom zaoos.com`;
        const xText = publishText + xAttribution;
        const truncated = xText.length > 280 ? xText.slice(0, 277) + '...' : xText;
        const content = { text: truncated, images: [] as string[], embeds: [], attribution: '', castHash: castHash || '', castUrl: '' };
        const xResult = await publishToX(content);
        return { platform: 'x' as const, url: xResult.tweetUrl };
      })(),

      // Telegram — only attempt if env vars are set
      (async () => {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
          return { platform: 'telegram' as const, skipped: true };
        }
        const { normalizeForTelegram } = await import('@/lib/publish/normalize');
        const { publishToTelegram, escapeMarkdownV2 } = await import('@/lib/publish/telegram');
        const normalized = normalizeForTelegram({
          text: publishText + attribution,
          castHash: castHash || 'proposal',
        });
        const result = await publishToTelegram({
          text: escapeMarkdownV2(normalized.text),
        });
        if (!result.success) {
          return { platform: 'telegram' as const, error: result.error };
        }
        return { platform: 'telegram' as const, messageId: result.messageId };
      })(),

      // Discord — only attempt if env var is set
      (async () => {
        if (!process.env.DISCORD_WEBHOOK_URL) {
          return { platform: 'discord' as const, skipped: true };
        }
        const { normalizeForDiscord } = await import('@/lib/publish/normalize');
        const { publishToDiscord, buildZaoEmbed } = await import('@/lib/publish/discord');
        const normalized = normalizeForDiscord({
          text: publishText + attribution,
          castHash: castHash || 'proposal',
        });
        const embed = buildZaoEmbed({
          title: fullProposal.title || 'ZAO Proposal',
          description: normalized.text,
          url: 'https://zaoos.com/governance',
          imageUrl: fullProposal.publish_image_url || undefined,
        });
        const result = await publishToDiscord({
          text: normalized.text,
          embeds: [embed],
          username: 'ZAO OS',
        });
        if (!result.success) {
          return { platform: 'discord' as const, error: result.error };
        }
        return { platform: 'discord' as const, messageId: result.messageId };
      })(),

      // Threads — only attempt if env vars are set
      (async () => {
        if (!process.env.THREADS_ACCESS_TOKEN) {
          return { platform: 'threads' as const, skipped: true };
        }
        try {
          const { normalizeForThreads } = await import('@/lib/publish/normalize');
          const { publishToThreads } = await import('@/lib/publish/threads');
          const normalized = normalizeForThreads({
            text: publishText + attribution,
            castHash: castHash || 'proposal',
          });
          const result = await publishToThreads(normalized);
          return { platform: 'threads' as const, url: result.postUrl };
        } catch (e) {
          return { platform: 'threads' as const, error: e instanceof Error ? e.message : 'Threads publish failed' };
        }
      })(),
    ]);

    // Process parallel results
    for (const result of parallelPublishResults) {
      if (result.status === 'rejected') continue;
      const val = result.value;
      if (val.platform === 'x') {
        if ('error' in val) {
          xError = val.error || 'Unknown X error';
          if (xError.includes('CreditsDepleted')) xError = 'X credits depleted — add credits at developer.x.com';
          else if (xError.includes('403')) xError = 'X permissions error — check app has Read+Write';
          else if (xError.includes('401')) xError = 'X auth failed — check API keys';
          logger.error('[publish-threshold] X publish failed:', xError);
        } else if ('url' in val) {
          xUrl = val.url ?? null;
          console.info(`[publish-threshold] Published to @thezaodao X: ${xUrl}`);
        }
      } else if (val.platform === 'telegram') {
        if ('skipped' in val) {
          console.info('[publish-threshold] Telegram skipped — not configured');
        } else if ('error' in val) {
          telegramError = val.error || 'Telegram publish failed';
          logger.error('[publish-threshold] Telegram publish failed:', telegramError);
        } else if ('messageId' in val) {
          telegramMessageId = val.messageId ?? null;
          console.info(`[publish-threshold] Published to Telegram: ${telegramMessageId}`);
        }
      } else if (val.platform === 'discord') {
        if ('skipped' in val) {
          console.info('[publish-threshold] Discord skipped — not configured');
        } else if ('error' in val) {
          discordError = val.error || 'Discord publish failed';
          logger.error('[publish-threshold] Discord publish failed:', discordError);
        } else if ('messageId' in val) {
          discordMessageId = val.messageId ?? null;
          console.info(`[publish-threshold] Published to Discord: ${discordMessageId}`);
        }
      } else if (val.platform === 'threads') {
        if ('skipped' in val) {
          console.info('[publish-threshold] Threads skipped — not configured');
        } else if ('error' in val) {
          threadsError = val.error || 'Threads publish failed';
          logger.error('[publish-threshold] Threads publish failed:', threadsError);
        } else if ('url' in val) {
          threadsUrl = val.url ?? null;
          console.info(`[publish-threshold] Published to Threads: ${threadsUrl}`);
        }
      }
    }

    // Mark proposal as published with all platform results
    const updateData: Record<string, unknown> = {
      published_cast_hash: castHash || null,
      published_at: new Date().toISOString(),
      status: 'published',
    };

    if (bskyUri) updateData.published_bluesky_uri = bskyUri;
    if (xUrl) updateData.published_x_url = xUrl;
    if (telegramMessageId) updateData.published_telegram_id = telegramMessageId;
    if (discordMessageId) updateData.published_discord_id = discordMessageId;
    if (threadsUrl) updateData.published_threads_url = threadsUrl;
    // Store errors for UI display
    if (fcError) updateData.publish_fc_error = fcError;
    if (bskyError) updateData.publish_bsky_error = bskyError;
    if (xError) updateData.publish_x_error = xError;
    if (telegramError) updateData.publish_telegram_error = telegramError;
    if (discordError) updateData.publish_discord_error = discordError;
    if (threadsError) updateData.publish_threads_error = threadsError;

    const { error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update(updateData)
      .eq('id', proposalId);

    if (updateErr) {
      logger.error('[publish-threshold] DB update failed:', updateErr);
      // Retry without bluesky URI column in case it doesn't exist
      const { error: retryErr } = await supabaseAdmin
        .from('proposals')
        .update({
          published_cast_hash: castHash || 'bluesky-only',
          published_at: new Date().toISOString(),
          status: 'published',
        })
        .eq('id', proposalId);

      if (retryErr) {
        logger.error('[publish-threshold] DB retry also failed:', retryErr);
      } else {
        console.info('[publish-threshold] DB updated (without bluesky URI column)');
      }
    } else {
      console.info('[publish-threshold] DB updated successfully — status: published');
    }

    return true;
  }

  return false;
}
