import { createPublicClient, http, parseAbi, formatEther, parseAbiItem } from 'viem';
import { optimism } from 'viem/chains';
import { supabaseAdmin } from '@/lib/db/supabase';

const OG_RESPECT = '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957' as const;
const ZOR_RESPECT = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as const;
const ZOR_TOKEN_ID = BigInt(0);

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

// OG contract deployed at block 123349892 (2024-07-30) — no transfers before this
const DEPLOYMENT_BLOCK = BigInt(123349892);

// Cache for 5 minutes
let cache: { data: LeaderboardResult; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// Persistent cache for first token dates (keyed by wallet address)
const firstTokenDateCache = new Map<string, string | null>();

// Module-level viem client for Optimism (reused across calls)
const optimismClient = createPublicClient({
  chain: optimism,
  transport: http('https://mainnet.optimism.io'),
});

type OptimismPublicClient = typeof optimismClient;

export interface RespectEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  username: string | null;
  zid: number | null;
  ogRespect: number;
  zorRespect: number;
  totalRespect: number;
  ogPct: number;
  zorPct: number;
  firstTokenDate: string | null;
}

export interface RespectStats {
  totalMembers: number;
  totalOG: number;
  totalZOR: number;
  ogTotalSupply: number;
  zorTotalSupply: number;
  holdersWithRespect: number;
}

export interface LeaderboardResult {
  leaderboard: RespectEntry[];
  stats: RespectStats;
}

/**
 * Get the date a wallet first received any respect token (OG or ZOR)
 * by querying Transfer event logs on Optimism.
 */
async function getFirstTokenDate(
  client: OptimismPublicClient,
  wallet: string
): Promise<string | null> {
  const lowerWallet = wallet.toLowerCase();

  if (firstTokenDateCache.has(lowerWallet)) {
    return firstTokenDateCache.get(lowerWallet) || null;
  }

  try {
    const [ogLogs, zorLogs] = await Promise.all([
      client.getLogs({
        address: OG_RESPECT,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        args: { to: wallet as `0x${string}` },
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: 'latest',
      }).catch((err: unknown) => {
        console.error(`OG getLogs failed for ${wallet}:`, err);
        return [];
      }),
      client.getLogs({
        address: ZOR_RESPECT,
        event: parseAbiItem('event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'),
        args: { to: wallet as `0x${string}` },
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: 'latest',
      }).catch((err: unknown) => {
        console.error(`ZOR getLogs failed for ${wallet}:`, err);
        return [];
      }),
    ]);

    const allBlocks: bigint[] = [];
    for (const log of ogLogs) {
      if (log.blockNumber) allBlocks.push(log.blockNumber);
    }
    for (const log of zorLogs) {
      if (log.blockNumber) allBlocks.push(log.blockNumber);
    }

    if (allBlocks.length === 0) {
      firstTokenDateCache.set(lowerWallet, null);
      return null;
    }

    const earliestBlock = allBlocks.reduce((min, b) => (b < min ? b : min));
    const block = await client.getBlock({ blockNumber: earliestBlock });
    const date = new Date(Number(block.timestamp) * 1000).toISOString().split('T')[0];

    firstTokenDateCache.set(lowerWallet, date);
    return date;
  } catch (err) {
    console.error(`Failed to get first token date for ${wallet}:`, err);
    firstTokenDateCache.set(lowerWallet, null);
    return null;
  }
}

/**
 * Fetch the respect leaderboard data. Returns cached data if fresh.
 */
export async function fetchLeaderboard(): Promise<LeaderboardResult> {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  // Get all members with wallets from users table
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
    return { leaderboard: [], stats: { totalOG: 0, totalZOR: 0, totalMembers: 0, ogTotalSupply: 0, zorTotalSupply: 0, holdersWithRespect: 0 } };
  }

  const client = optimismClient;

  // Build multicall: per-wallet balances + total supply for both tokens
  const contracts = [
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

  const ogSupplyRaw = results[0].status === 'success' ? (results[0].result as bigint) : BigInt(0);
  const zorSupplyRaw = results[1].status === 'success' ? (results[1].result as bigint) : BigInt(0);
  const ogTotalSupply = Number(formatEther(ogSupplyRaw));
  const zorTotalSupply = Number(zorSupplyRaw);

  const leaderboard = walletsToCheck.map((entry, idx) => {
    const ogResult = results[2 + idx * 2];
    const zorResult = results[2 + idx * 2 + 1];

    const ogRaw = ogResult.status === 'success' ? (ogResult.result as bigint) : BigInt(0);
    const zorRaw = zorResult.status === 'success' ? (zorResult.result as bigint) : BigInt(0);

    const ogBalance = Number(formatEther(ogRaw));
    const zorBalance = Number(zorRaw);
    const total = ogBalance + zorBalance;

    const ogPct = ogTotalSupply > 0 ? (ogBalance / ogTotalSupply) * 100 : 0;
    const zorPct = zorTotalSupply > 0 ? (zorBalance / zorTotalSupply) * 100 : 0;

    return {
      name: entry.name,
      wallet: entry.wallet,
      fid: entry.fid,
      username: entry.username,
      zid: entry.zid,
      ogRespect: Math.round(ogBalance),
      zorRespect: zorBalance,
      totalRespect: Math.round(total),
      ogPct: Math.round(ogPct * 10) / 10,
      zorPct: Math.round(zorPct * 10) / 10,
      firstTokenDate: null as string | null,
    };
  });

  // Fetch first token dates for users with respect
  const withRespect = leaderboard.filter((e) => e.totalRespect > 0);
  const dateResults = await Promise.all(
    withRespect.map((e) => getFirstTokenDate(client, e.wallet))
  );
  withRespect.forEach((entry, i) => {
    entry.firstTokenDate = dateResults[i];
  });

  // Sort by total descending, assign ranks
  leaderboard.sort((a, b) => b.totalRespect - a.totalRespect);
  const ranked = leaderboard.map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  const stats: RespectStats = {
    totalMembers: ranked.length,
    totalOG: ranked.reduce((sum, e) => sum + e.ogRespect, 0),
    totalZOR: ranked.reduce((sum, e) => sum + e.zorRespect, 0),
    ogTotalSupply: Math.round(ogTotalSupply),
    zorTotalSupply: zorTotalSupply,
    holdersWithRespect: ranked.filter((e) => e.totalRespect > 0).length,
  };

  const result: LeaderboardResult = { leaderboard: ranked, stats };
  cache = { data: result, timestamp: Date.now() };

  return result;
}
