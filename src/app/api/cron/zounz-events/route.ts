import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';
import { ZOUNZ_GOVERNOR, ZOUNZ_AUCTION } from '@/lib/zounz/contracts';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const governorAbi = [
  {
    name: 'proposalCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const auctionAbi = [
  {
    name: 'auction',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'highestBid', type: 'uint256' },
      { name: 'highestBidder', type: 'address' },
      { name: 'startTime', type: 'uint40' },
      { name: 'endTime', type: 'uint40' },
      { name: 'settled', type: 'bool' },
    ],
  },
] as const;

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const events: string[] = [];

    // --- Check for new proposals ---
    const proposalCount = await client.readContract({
      address: ZOUNZ_GOVERNOR as `0x${string}`,
      abi: governorAbi,
      functionName: 'proposalCount',
    });

    const { data: lastState } = await supabaseAdmin
      .from('system_state')
      .select('value')
      .eq('key', 'zounz_proposal_count')
      .single();

    const lastCount = lastState?.value ? Number(lastState.value) : 0;
    const currentCount = Number(proposalCount);

    if (currentCount > lastCount) {
      const newCount = currentCount - lastCount;
      events.push(`${newCount} new proposal(s)`);

      const { data: members } = await supabaseAdmin
        .from('users')
        .select('fid')
        .not('fid', 'is', null)
        .eq('is_active', true);

      const fids = (members || []).map(m => m.fid).filter(Boolean) as number[];

      await createInAppNotification({
        recipientFids: fids,
        type: 'proposal',
        title: 'New ZOUNZ Proposal',
        body: `${newCount} new proposal${newCount > 1 ? 's' : ''} submitted to ZOUNZ Governor`,
        href: '/governance',
      });

      await supabaseAdmin
        .from('system_state')
        .upsert({ key: 'zounz_proposal_count', value: String(currentCount) }, { onConflict: 'key' });
    }

    // --- Check auction state ---
    const auction = await client.readContract({
      address: ZOUNZ_AUCTION as `0x${string}`,
      abi: auctionAbi,
      functionName: 'auction',
    });

    const [tokenId, highestBid, , , endTime, settled] = auction;
    const endTimeMs = Number(endTime) * 1000;
    const now = Date.now();
    const minutesLeft = Math.floor((endTimeMs - now) / 60000);

    if (!settled && minutesLeft > 0 && minutesLeft <= 30) {
      const { data: lastAlert } = await supabaseAdmin
        .from('system_state')
        .select('value')
        .eq('key', `zounz_auction_alert_${tokenId}`)
        .single();

      if (!lastAlert) {
        events.push(`Auction #${tokenId} ending in ${minutesLeft}m`);

        const { data: members } = await supabaseAdmin
          .from('users')
          .select('fid')
          .not('fid', 'is', null)
          .eq('is_active', true);

        const fids = (members || []).map(m => m.fid).filter(Boolean) as number[];

        const bidEth = Number(highestBid) / 1e18;
        await createInAppNotification({
          recipientFids: fids,
          type: 'system',
          title: `ZOUNZ #${tokenId} Auction Ending Soon`,
          body: `${minutesLeft} minutes left — current bid: ${bidEth.toFixed(4)} ETH`,
          href: '/governance',
        });

        await supabaseAdmin
          .from('system_state')
          .upsert({ key: `zounz_auction_alert_${tokenId}`, value: 'sent' }, { onConflict: 'key' });
      }
    }

    return NextResponse.json({
      success: true,
      proposalCount: currentCount,
      auctionTokenId: Number(tokenId),
      auctionSettled: settled,
      events,
    });
  } catch (error) {
    console.error('[cron/zounz-events] Error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
