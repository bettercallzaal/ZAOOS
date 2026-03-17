import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatEther } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { communityConfig } from '@/../community.config';

const { ogContract: OG_RESPECT, zorContract: ZOR_RESPECT, zorTokenId: ZOR_TOKEN_ID } =
  communityConfig.respect;

const ogAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
const zorAbi = parseAbi([
  'function balanceOf(address, uint256) view returns (uint256)',
]);

/**
 * POST /api/respect/sync
 * Admin-only endpoint that reads on-chain OG (ERC-20) and ZOR (ERC-1155)
 * balances for all respect_members and updates the DB.
 */
export async function POST() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // 1. Get all respect_members with a wallet_address
    const { data: members, error: membersErr } = await supabaseAdmin
      .from('respect_members')
      .select('id, name, wallet_address')
      .not('wallet_address', 'is', null);

    if (membersErr) {
      console.error('Failed to fetch respect_members:', membersErr);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No members with wallet addresses' });
    }

    // Filter out members with empty/invalid wallet addresses
    const walletsToSync = members.filter(
      (m) => m.wallet_address && m.wallet_address.startsWith('0x')
    );

    if (walletsToSync.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No valid wallet addresses to sync' });
    }

    // 2. Build multicall to read OG + ZOR balances for each member
    const client = createPublicClient({
      chain: optimism,
      transport: http('https://mainnet.optimism.io'),
    });

    const contracts = walletsToSync.flatMap((member) => [
      {
        address: OG_RESPECT,
        abi: ogAbi,
        functionName: 'balanceOf' as const,
        args: [member.wallet_address as `0x${string}`],
      },
      {
        address: ZOR_RESPECT,
        abi: zorAbi,
        functionName: 'balanceOf' as const,
        args: [member.wallet_address as `0x${string}`, ZOR_TOKEN_ID],
      },
    ]);

    const results = await client.multicall({ contracts });

    // 3. Update each member's onchain_og and onchain_zor in Supabase
    let syncedCount = 0;
    const errors: string[] = [];

    const updates = walletsToSync.map((member, idx) => {
      const ogResult = results[idx * 2];
      const zorResult = results[idx * 2 + 1];

      const ogRaw = ogResult.status === 'success' ? (ogResult.result as bigint) : BigInt(0);
      const zorRaw = zorResult.status === 'success' ? (zorResult.result as bigint) : BigInt(0);

      // OG is ERC-20 with 18 decimals, ZOR is ERC-1155 (whole tokens)
      const onchainOg = Math.round(Number(formatEther(ogRaw)));
      const onchainZor = Number(zorRaw);

      return supabaseAdmin
        .from('respect_members')
        .update({
          onchain_og: onchainOg,
          onchain_zor: onchainZor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id)
        .then(({ error: updateErr }) => {
          if (updateErr) {
            errors.push(`${member.name}: ${updateErr.message}`);
          } else {
            syncedCount++;
          }
        });
    });

    await Promise.allSettled(updates);

    return NextResponse.json({
      synced: syncedCount,
      total: walletsToSync.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Respect sync error:', err);
    return NextResponse.json({ error: 'Failed to sync on-chain balances' }, { status: 500 });
  }
}
