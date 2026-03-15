import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatEther, formatUnits } from 'viem';
import { optimism } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const OG_RESPECT = '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as const;
const ZOR_RESPECT = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as const;
const ZOR_TOKEN_ID = BigInt(0);
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

const ogDetailAbi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);
const zorDetailAbi = parseAbi([
  'function balanceOf(address, uint256) view returns (uint256)',
  'function totalSupply(uint256) view returns (uint256)',
]);

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
    // Get all members with wallets from users table (primary source)
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, display_name, ign, real_name, primary_wallet, respect_wallet, fid, username, zid')
      .eq('is_active', true);

    if (usersErr) throw usersErr;

    // Use respect_wallet if set, fall back to primary_wallet
    const walletsToCheck = (users || [])
      .filter((m) => {
        const w = m.respect_wallet || m.primary_wallet;
        return w && !w.startsWith('fid:');
      })
      .map((m) => ({
        id: m.id,
        name: m.display_name || m.ign || m.real_name || `FID ${m.fid}`,
        wallet: (m.respect_wallet || m.primary_wallet) as string,
        fid: m.fid,
        username: m.username || null,
        zid: m.zid || null,
      }));

    if (walletsToCheck.length === 0) {
      return NextResponse.json({ leaderboard: [], stats: { totalOG: 0, totalZOR: 0, totalMembers: 0 } });
    }

    const client = createPublicClient({
      chain: optimism,
      transport: http('https://mainnet.optimism.io'),
    });

    // Build multicall: per-wallet balances + total supply for both tokens
    const contracts = [
      // Total supply calls (first 2 results)
      {
        address: OG_RESPECT,
        abi: ogDetailAbi,
        functionName: 'totalSupply' as const,
        args: [],
      },
      {
        address: ZOR_RESPECT,
        abi: zorDetailAbi,
        functionName: 'totalSupply' as const,
        args: [ZOR_TOKEN_ID],
      },
      // Per-wallet balance calls
      ...walletsToCheck.flatMap((entry) => [
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
      ]),
    ];

    const results = await client.multicall({ contracts });

    // Extract total supply
    const ogSupplyRaw = results[0].status === 'success' ? (results[0].result as bigint) : BigInt(0);
    const zorSupplyRaw = results[1].status === 'success' ? (results[1].result as bigint) : BigInt(0);
    const ogTotalSupply = Number(formatEther(ogSupplyRaw));
    const zorTotalSupply = Number(zorSupplyRaw);

    // Parse per-wallet results (offset by 2 for the supply calls)
    const leaderboard = walletsToCheck.map((entry, idx) => {
      const ogResult = results[2 + idx * 2];
      const zorResult = results[2 + idx * 2 + 1];

      const ogRaw = ogResult.status === 'success' ? (ogResult.result as bigint) : BigInt(0);
      const zorRaw = zorResult.status === 'success' ? (zorResult.result as bigint) : BigInt(0);

      const ogBalance = Number(formatEther(ogRaw));
      const zorBalance = Number(zorRaw);
      const total = ogBalance + zorBalance;

      // Percentage of total supply this user holds
      const ogPct = ogTotalSupply > 0 ? (ogBalance / ogTotalSupply) * 100 : 0;
      const zorPct = zorTotalSupply > 0 ? (zorBalance / zorTotalSupply) * 100 : 0;

      return {
        name: entry.name,
        wallet: entry.wallet,
        fid: entry.fid,
        username: entry.username,
        zid: entry.zid,
        userId: entry.id,
        ogRespect: Math.round(ogBalance),
        zorRespect: zorBalance,
        totalRespect: Math.round(total),
        ogPct: Math.round(ogPct * 10) / 10,
        zorPct: Math.round(zorPct * 10) / 10,
      };
    });

    // Sort by total descending, assign ranks
    leaderboard.sort((a, b) => b.totalRespect - a.totalRespect);
    const ranked = leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    // Remove internal userId from response
    const publicRanked = ranked.map(({ userId, ...rest }) => rest);

    const stats = {
      totalMembers: ranked.length,
      totalOG: ranked.reduce((sum, e) => sum + e.ogRespect, 0),
      totalZOR: ranked.reduce((sum, e) => sum + e.zorRespect, 0),
      ogTotalSupply: Math.round(ogTotalSupply),
      zorTotalSupply: zorTotalSupply,
      holdersWithRespect: ranked.filter((e) => e.totalRespect > 0).length,
    };

    const responseData = { leaderboard: publicRanked, stats, currentFid: session.fid };
    cache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Respect leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load respect data' }, { status: 500 });
  }
}
