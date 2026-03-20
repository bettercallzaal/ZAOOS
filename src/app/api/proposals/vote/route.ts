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
    if (vote === 'for') {
      checkPublishThreshold(proposal_id).catch((err) =>
        console.error('[publish-threshold]', err)
      );
    }

    return NextResponse.json({ vote: voteData, respectWeight });
  } catch (err) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}

/**
 * Check if a proposal has reached the Respect vote threshold for auto-publishing
 * to @thezao Farcaster account. Non-blocking, fire-and-forget.
 */
async function checkPublishThreshold(proposalId: string) {
  const ENV = await import('@/lib/env').then((m) => m.ENV);

  // Skip if not configured
  if (!ENV.ZAO_OFFICIAL_SIGNER_UUID || !ENV.ZAO_OFFICIAL_FID) return;

  // Get proposal with publish info
  const { data: proposal } = await supabaseAdmin
    .from('proposals')
    .select('id, publish_text, published_cast_hash, respect_threshold, status')
    .eq('id', proposalId)
    .single();

  if (!proposal) return;

  // Skip if already published or no publish_text
  if (proposal.published_cast_hash) return;
  if (!proposal.publish_text) return;

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
    // Threshold met — trigger publish via internal API
    console.log(`[publish-threshold] Proposal ${proposalId} reached ${totalRespectFor}/${threshold} Respect — auto-publishing`);

    // Import and call directly instead of HTTP to avoid auth issues
    const { postCast } = await import('@/lib/farcaster/neynar');

    const { data: fullProposal } = await supabaseAdmin
      .from('proposals')
      .select('*, author:users!proposals_author_id_fkey(display_name, username)')
      .eq('id', proposalId)
      .single();

    if (!fullProposal) return;

    const authorName = fullProposal.author?.username || fullProposal.author?.display_name || 'ZAO member';
    const publishText = fullProposal.publish_text;
    const attribution = `\n\n— Proposed by @${authorName} • Approved by ZAO governance`;
    const maxLen = 1024 - attribution.length;
    const castText = publishText.length > maxLen
      ? publishText.slice(0, maxLen - 3) + '...' + attribution
      : publishText + attribution;

    const result = await postCast(
      ENV.ZAO_OFFICIAL_SIGNER_UUID!,
      castText,
      'zao',
    );

    const castHash = result?.cast?.hash;

    await supabaseAdmin
      .from('proposals')
      .update({
        published_cast_hash: castHash,
        published_at: new Date().toISOString(),
        status: 'published',
      })
      .eq('id', proposalId);

    console.log(`[publish-threshold] Published to @thezao: ${castHash}`);
  }
}
