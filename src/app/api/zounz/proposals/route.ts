import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { ZOUNZ_GOVERNOR, governorAbi } from '@/lib/zounz/contracts';
import { communityConfig } from '@/../community.config';
import { logger } from '@/lib/logger';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

/**
 * GET — Fetch ZOUNZ on-chain proposal count and governance info
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [proposalCount, proposalThreshold, quorum] = await Promise.allSettled([
      client.readContract({
        address: ZOUNZ_GOVERNOR,
        abi: governorAbi,
        functionName: 'proposalCount',
      }),
      client.readContract({
        address: ZOUNZ_GOVERNOR,
        abi: governorAbi,
        functionName: 'proposalThreshold',
      }),
      client.readContract({
        address: ZOUNZ_GOVERNOR,
        abi: governorAbi,
        functionName: 'quorum',
      }),
    ]);

    return NextResponse.json({
      proposalCount: proposalCount.status === 'fulfilled' ? Number(proposalCount.value) : 0,
      proposalThreshold: proposalThreshold.status === 'fulfilled' ? Number(proposalThreshold.value) : null,
      quorum: quorum.status === 'fulfilled' ? Number(quorum.value) : null,
      governorAddress: ZOUNZ_GOVERNOR,
      nounsBuilderUrl: communityConfig.zounz.nounsBuilderUrl,
      voteUrl: `${communityConfig.zounz.nounsBuilderUrl}/vote`,
      proposeUrl: `${communityConfig.zounz.nounsBuilderUrl}/vote`,
    });
  } catch (err) {
    logger.error('[zounz/proposals] Error reading governor contract:', err);
    return NextResponse.json(
      { error: 'Failed to read governor contract' },
      { status: 500 }
    );
  }
}
