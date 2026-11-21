import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import { createInAppNotification } from '@/lib/notifications';
import { draftOfficialCast } from '@/lib/publish/official-draft';
import { computeRespectWeight } from '@/lib/respect/voteWeight';
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
        { status: 400 },
      );
    }
    const { proposal_id, vote } = parsed.data;

    // Fetch proposal and user in parallel (independent queries)
    const [proposalResult, userResult] = await Promise.all([
      supabaseAdmin.from('proposals').select('status, closes_at').eq('id', proposal_id).single(),
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
          {
            address: ZOR_RESPECT,
            abi: zorAbi,
            functionName: 'balanceOf',
            args: [wallet, ZOR_TOKEN_ID],
          },
        ],
      });

      const computed = computeRespectWeight(ogBalance, zorBalance);
      // A failed on-chain read previously became 0, silently undercounting the
      // vote. Refuse to record a vote with an incomplete balance read - ask the
      // voter to retry rather than store a corrupted weight.
      if (!computed.complete) {
        logger.error(
          `[vote] respect balance read failed (${computed.failed.join(',')}) for ${wallet}`,
        );
        return NextResponse.json(
          { error: 'Could not read your on-chain Respect balance. Please try again.' },
          { status: 503 },
        );
      }
      respectWeight = computed.weight;
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
        { onConflict: 'proposal_id,voter_id' },
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
        .single(),
    )
      .then(({ data: p }) => {
        const authorFid = (p?.users as unknown as { fid: number } | null)?.fid;
        if (authorFid && authorFid !== session.fid) {
          createInAppNotification({
            recipientFids: [authorFid],
            type: 'vote',
            title: `Vote: ${vote}`,
            body: `${session.displayName} voted ${vote} on "${((p?.title as string) || '').slice(0, 60)}"`,
            href: '/governance',
            actorFid: session.fid,
            actorDisplayName: session.displayName,
            actorPfpUrl: session.pfpUrl,
          }).catch((err) => logger.error('[notify]', err));
        }
      })
      .catch((err) => logger.error('[notify]', err));

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
      response.warning =
        'Your vote was recorded but has zero weight. Earn Respect through fractal participation to increase your voting power.';
    }
    return NextResponse.json(response);
  } catch (err) {
    logger.error('Vote error:', err);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}

/**
 * Check if a proposal has reached the Respect vote threshold. Since 20 Nov 2026
 * it is drafted to Zaal's ZOE chat, not published. Returns false: nothing is published.
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
  // Skip if already drafted for Zaal (threshold met earlier) or approved by an admin
  if (proposal.status === 'approved') return false;

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
    .reduce(
      (sum: number, v: { respect_weight: number | null }) => sum + (v.respect_weight || 0),
      0,
    );

  const threshold = proposal.respect_threshold || 1000;

  if (totalRespectFor >= threshold) {
    logger.info(
      `[publish-threshold] Proposal ${proposalId} reached ${totalRespectFor}/${threshold} Respect, drafting for Zaal (not publishing)`,
    );

    const { data: fullProposal } = await supabaseAdmin
      .from('proposals')
      .select('*, author:users!proposals_author_id_fkey(display_name, username)')
      .eq('id', proposalId)
      .single();

    if (!fullProposal) return false;

    const authorName =
      fullProposal.author?.username || fullProposal.author?.display_name || 'ZAO member';
    // Use publish_text if set, otherwise title only (avoid duplicating if title === description)
    const publishText =
      fullProposal.publish_text ||
      (fullProposal.title === fullProposal.description
        ? fullProposal.title
        : `${fullProposal.title}\n\n${fullProposal.description}`);
    const attribution = `\n\n— Proposed by @${authorName} • Approved by ZAO governance\nfrom zaoos.com`;

    // Zaal ruling (vault 2e556756, 20 Nov 2026): an approved proposal is no
    // longer auto-published to Farcaster, Bluesky, X, Threads, Telegram or
    // Discord. It becomes ONE draft in Zaal's ZOE Telegram chat. He posts it by
    // hand, or an admin publishes it through /api/publish/farcaster.
    const isWavewarz = fullProposal.category === 'wavewarz';
    const target = isWavewarz
      ? 'Farcaster /wavewarz plus the mirrors'
      : 'Farcaster /zao as @thezao plus the mirrors';

    await draftOfficialCast({
      text: publishText + attribution,
      embedUrl: fullProposal.publish_image_url || undefined,
      target,
      source: `proposal-approved ${proposalId}`,
    });

    // Mark it approved so later votes do not send the same draft again. The
    // existing 'approved' status means "admin can then publish" (see
    // src/app/api/proposals/route.ts). published_* fields stay empty: nothing
    // was published.
    const { error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update({ status: 'approved' })
      .eq('id', proposalId);

    if (updateErr) {
      logger.error('[publish-threshold] DB update to approved failed:', updateErr);
    }

    return false;
  }

  return false;
}
