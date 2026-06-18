import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { communityConfig } from '@/../community.config';
import { readMemberBalances } from '@/lib/respect/onchainBalances';
import { logger } from '@/lib/logger';

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
      logger.error('Failed to fetch respect_members:', membersErr);
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
    const skipped: string[] = [];

    const updates = walletsToSync
      .map((member, idx) => {
        const balances = readMemberBalances(results[idx * 2], results[idx * 2 + 1]);

        // A failed on-chain read must NOT be written as 0 - that would silently
        // wipe the member's cached Respect. Skip them so their value is kept.
        if (!balances.complete) {
          skipped.push(`${member.name} (${balances.failed.join(',')} read failed)`);
          return null;
        }

        return supabaseAdmin
          .from('respect_members')
          .update({
            onchain_og: balances.onchainOg,
            onchain_zor: balances.onchainZor,
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
      })
      .filter((u): u is NonNullable<typeof u> => u !== null);

    await Promise.allSettled(updates);

    if (skipped.length > 0) {
      logger.warn(`[respect-sync] skipped ${skipped.length} members with failed balance reads`);
    }

    return NextResponse.json({
      synced: syncedCount,
      total: walletsToSync.length,
      skipped: skipped.length > 0 ? skipped : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.error('Respect sync error:', err);
    return NextResponse.json({ error: 'Failed to sync on-chain balances' }, { status: 500 });
  }
}
