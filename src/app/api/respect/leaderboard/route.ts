import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatEther } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const OG_RESPECT = '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as const;
const ZOR_RESPECT = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as const;
const ZOR_TOKEN_ID = BigInt(0);
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

const ogAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
const zorAbi = parseAbi(['function balanceOf(address, uint256) view returns (uint256)']);

// Cache for 5 minutes
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Get all members with wallets from allowlist
    const { data: members, error } = await supabaseAdmin
      .from('allowlist')
      .select('real_name, ign, wallet_address, fid, username')
      .eq('is_active', true)
      .not('wallet_address', 'is', null);

    if (error) throw error;

    const walletsToCheck = members
      .filter((m) => m.wallet_address)
      .map((m) => ({
        name: m.ign || m.real_name || `FID ${m.fid}`,
        wallet: m.wallet_address as string,
        fid: m.fid,
        username: m.username || null,
      }));

    if (walletsToCheck.length === 0) {
      return NextResponse.json({ leaderboard: [], stats: { totalOG: 0, totalZOR: 0, totalMembers: 0 } });
    }

    const client = createPublicClient({
      chain: optimism,
      transport: http('https://mainnet.optimism.io'),
    });

    // Build multicall for all wallets: OG balance + ZOR balance per wallet
    const contracts = walletsToCheck.flatMap((entry) => [
      {
        address: OG_RESPECT,
        abi: ogAbi,
        functionName: 'balanceOf' as const,
        args: [entry.wallet as `0x${string}`],
      },
      {
        address: ZOR_RESPECT,
        abi: zorAbi,
        functionName: 'balanceOf' as const,
        args: [entry.wallet as `0x${string}`, ZOR_TOKEN_ID],
      },
    ]);

    const results = await client.multicall({ contracts });

    // Parse results into leaderboard
    const leaderboard = walletsToCheck.map((entry, idx) => {
      const ogResult = results[idx * 2];
      const zorResult = results[idx * 2 + 1];

      const ogBalance = ogResult.status === 'success' ? Number(formatEther(ogResult.result as bigint)) : 0;
      const zorBalance = zorResult.status === 'success' ? Number(zorResult.result as bigint) : 0;
      const total = ogBalance + zorBalance;

      return {
        name: entry.name,
        wallet: entry.wallet,
        fid: entry.fid,
        username: entry.username,
        ogRespect: Math.round(ogBalance),
        zorRespect: zorBalance,
        totalRespect: Math.round(total),
      };
    });

    // Sort by total descending, assign ranks
    leaderboard.sort((a, b) => b.totalRespect - a.totalRespect);
    const ranked = leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    const stats = {
      totalMembers: ranked.length,
      totalOG: ranked.reduce((sum, e) => sum + e.ogRespect, 0),
      totalZOR: ranked.reduce((sum, e) => sum + e.zorRespect, 0),
    };

    const responseData = { leaderboard: ranked, stats, currentFid: session.fid };
    cache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Respect leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load respect data' }, { status: 500 });
  }
}
