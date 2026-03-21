import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatEther } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
import { proposalVoteSchema } from '@/lib/validation/schemas';

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

    // Check proposal is open
    const { data: proposal } = await supabaseAdmin
      .from('proposals')
      .select('status, closes_at')
      .eq('id', proposal_id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'open') {
      return NextResponse.json({ error: 'Proposal is no longer open for voting' }, { status: 400 });
    }

    if (proposal.closes_at && new Date(proposal.closes_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Voting period has ended' }, { status: 400 });
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, primary_wallet, respect_wallet')
      .eq('fid', session.fid)
      .single();

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

    if (error) throw error;

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
        }).catch((err) => console.error('[notify]', err));
      }
    }).catch((err) => console.error('[notify]', err));

    // Check if this vote pushed the proposal over the publish threshold
    // Must await — fire-and-forget gets killed by Vercel function timeout
    let published = false;
    if (vote === 'for') {
      try {
        published = await checkPublishThreshold(proposal_id);
      } catch (err) {
        console.error('[publish-threshold]', err);
      }
    }

    return NextResponse.json({ vote: voteData, respectWeight, published });
  } catch (err) {
    console.error('Vote error:', err);
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
    .select('id, publish_text, published_cast_hash, respect_threshold, status')
    .eq('id', proposalId)
    .single();

  if (!proposal) return false;

  // Skip if already published
  if (proposal.published_cast_hash) return false;

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
    console.log(`[publish-threshold] Proposal ${proposalId} reached ${totalRespectFor}/${threshold} Respect — auto-publishing`);

    const { data: fullProposal } = await supabaseAdmin
      .from('proposals')
      .select('*, author:users!proposals_author_id_fkey(display_name, username)')
      .eq('id', proposalId)
      .single();

    if (!fullProposal) return false;

    const authorName = fullProposal.author?.username || fullProposal.author?.display_name || 'ZAO member';
    // Use publish_text if set, otherwise fallback to title + description
    const publishText = fullProposal.publish_text
      || `${fullProposal.title}\n\n${fullProposal.description}`;
    const attribution = `\n\n— Proposed by @${authorName} • Approved by ZAO governance`;

    let castHash: string | null = null;

    // Publish to @thezao Farcaster (if signer configured)
    const ENV = await import('@/lib/env').then((m) => m.ENV);
    if (ENV.ZAO_OFFICIAL_SIGNER_UUID && ENV.ZAO_OFFICIAL_FID) {
      try {
        const { postCast } = await import('@/lib/farcaster/neynar');
        const maxLen = 1024 - attribution.length;
        const castText = publishText.length > maxLen
          ? publishText.slice(0, maxLen - 3) + '...' + attribution
          : publishText + attribution;

        // Include image as embed URL if set
        const embedUrls = fullProposal.publish_image_url ? [fullProposal.publish_image_url] : undefined;

        const result = await postCast(
          ENV.ZAO_OFFICIAL_SIGNER_UUID,
          castText,
          'zao',
          undefined,
          undefined,
          embedUrls,
          undefined,
          ENV.ZAO_OFFICIAL_NEYNAR_API_KEY,
        );
        castHash = result?.cast?.hash || null;
        console.log(`[publish-threshold] Published to @thezao Farcaster: ${castHash}`);
      } catch (fcErr) {
        console.error('[publish-threshold] Farcaster publish failed:', fcErr);
      }
    } else {
      console.warn('[publish-threshold] Farcaster signer not configured — skipping Farcaster publish');
    }

    // Publish to @thezao Bluesky (independent of Farcaster)
    let bskyUri: string | null = null;
    try {
      const { postToBluesky } = await import('@/lib/bluesky/client');
      bskyUri = await postToBluesky(
        publishText + attribution,
        'https://zaoos.com/governance',
      );
      if (bskyUri) {
        console.log(`[publish-threshold] Published to @thezao Bluesky: ${bskyUri}`);
      }
    } catch (bskyErr) {
      console.error('[publish-threshold] Bluesky publish failed:', bskyErr);
    }

    // Mark proposal as published — try with bluesky URI first, fallback without
    const updateData: Record<string, unknown> = {
      published_cast_hash: castHash || 'bluesky-only',
      published_at: new Date().toISOString(),
      status: 'published',
    };

    // Only include bluesky URI if the column exists
    if (bskyUri) {
      updateData.published_bluesky_uri = bskyUri;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update(updateData)
      .eq('id', proposalId);

    if (updateErr) {
      console.error('[publish-threshold] DB update failed:', updateErr);
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
        console.error('[publish-threshold] DB retry also failed:', retryErr);
      } else {
        console.log('[publish-threshold] DB updated (without bluesky URI column)');
      }
    } else {
      console.log('[publish-threshold] DB updated successfully — status: published');
    }

    return true;
  }

  return false;
}
