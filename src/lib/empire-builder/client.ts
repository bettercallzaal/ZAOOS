// Server-side Empire Builder V3 read client.
// Public reads need no auth (per docs as of 2026-05-01). EMPIRE_BUILDER_API_KEY is
// reserved for future write/whitelisted endpoints (distribute, burn, airdrop).
// Never import this module from client components — it reads env vars at module load.

import { z } from 'zod';
import {
  EMPIRE_BUILDER_BASE_URL,
  EMPIRE_BUILDER_FETCH_TIMEOUT_MS,
  ZABAL_TOKEN_ADDRESS,
} from './config';
import {
  addressStatsResponseSchema,
  type AddressStatsResponse,
  type Booster,
  boosterSchema,
  type EmpireSummary,
  empireSummarySchema,
  leaderboardListResponseSchema,
  type LeaderboardResponse,
  leaderboardResponseSchema,
  leaderboardSlotSchema,
  type LeaderboardSlot,
  rewardsByTypeResponseSchema,
  type RewardsByTypeResponse,
  rewardsSummaryResponseSchema,
  type RewardsSummaryResponse,
} from './types';

const apiKey = process.env.EMPIRE_BUILDER_API_KEY;

interface FetchOptions {
  signal?: AbortSignal;
}

async function ebFetch<T>(path: string, schema: z.ZodType<T>, opts: FetchOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${EMPIRE_BUILDER_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMPIRE_BUILDER_FETCH_TIMEOUT_MS);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: opts.signal ?? controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Empire Builder API ${res.status} for ${path}`);
    }
    const json = (await res.json()) as unknown;
    return schema.parse(json);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getTopEmpires(params: { page?: number; limit?: number } = {}): Promise<EmpireSummary[]> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const responseSchema = z
    .object({
      empires: z.array(empireSummarySchema).optional(),
      data: z.array(empireSummarySchema).optional(),
    })
    .passthrough();
  const data = await ebFetch(`/top-empires?page=${page}&limit=${limit}`, responseSchema);
  return data.empires ?? data.data ?? [];
}

export async function getEmpire(empireId: string): Promise<EmpireSummary | null> {
  const responseSchema = z
    .object({
      empire: empireSummarySchema.optional(),
      success: z.boolean().optional(),
    })
    .passthrough();
  try {
    const data = await ebFetch(`/empires/${empireId}`, responseSchema);
    return data.empire ?? (empireSummarySchema.safeParse(data).success ? (data as EmpireSummary) : null);
  } catch {
    return null;
  }
}

export async function discoverLeaderboards(
  tokenAddress: string = ZABAL_TOKEN_ADDRESS,
): Promise<LeaderboardSlot[]> {
  const data = await ebFetch(
    `/leaderboards?tokenAddress=${tokenAddress}`,
    leaderboardListResponseSchema,
  );
  if (data.leaderboards && data.leaderboards.length > 0) return data.leaderboards;

  // Defensive: handle alternative shapes the docs hint at without committing to one
  const altShape = z
    .object({
      data: z.array(leaderboardSlotSchema).optional(),
      results: z.array(leaderboardSlotSchema).optional(),
    })
    .passthrough()
    .safeParse(data);
  if (altShape.success) {
    return altShape.data.data ?? altShape.data.results ?? [];
  }
  return [];
}

export async function getLeaderboard(leaderboardId: string): Promise<LeaderboardResponse> {
  return ebFetch(`/leaderboards/${leaderboardId}`, leaderboardResponseSchema);
}

export async function getLeaderboardForAddress(
  leaderboardId: string,
  walletAddress: string,
): Promise<AddressStatsResponse | null> {
  try {
    return await ebFetch(
      `/leaderboards/${leaderboardId}/address/${walletAddress}`,
      addressStatsResponseSchema,
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

export async function getBoosters(empireId: string): Promise<Booster[]> {
  const responseSchema = z
    .object({
      boosters: z.array(boosterSchema).optional(),
      data: z.array(boosterSchema).optional(),
    })
    .passthrough();
  const data = await ebFetch(`/boosters/${empireId}`, responseSchema);
  return data.boosters ?? data.data ?? [];
}

export async function getRewardsSummary(empireId: string): Promise<RewardsSummaryResponse> {
  return ebFetch(`/empire-rewards/${empireId}`, rewardsSummaryResponseSchema);
}

export async function getRewardsByType(
  empireId: string,
  type: 'distribute' | 'burned' | 'airdrop',
): Promise<RewardsByTypeResponse> {
  return ebFetch(`/empire-rewards/${empireId}/${type}`, rewardsByTypeResponseSchema);
}

interface ZabalSnapshot {
  empire: EmpireSummary | null;
  topLeaderboard: LeaderboardResponse | null;
  rewardsSummary: RewardsSummaryResponse | null;
  totals: {
    lifetimeDistributedUsd: number;
    lifetimeBurned: number;
    distributionCount: number;
    burnCount: number;
  };
}

// API inconsistency: empire-rewards summary returns amounts as "$12.6" strings,
// while empire-rewards/<id>/distribute returns numeric `total_amount`. Strip
// any non-numeric prefix before parsing.
function toNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export async function getZabalSnapshot(): Promise<ZabalSnapshot> {
  // Resolve empire + first leaderboard + rewards in parallel.
  const [empire, leaderboards, rewardsSummary] = await Promise.allSettled([
    getEmpire(ZABAL_TOKEN_ADDRESS),
    discoverLeaderboards(ZABAL_TOKEN_ADDRESS),
    getRewardsSummary(ZABAL_TOKEN_ADDRESS),
  ]);

  const empireData = empire.status === 'fulfilled' ? empire.value : null;
  const slots = leaderboards.status === 'fulfilled' ? leaderboards.value : [];
  const summary = rewardsSummary.status === 'fulfilled' ? rewardsSummary.value : null;

  let topLeaderboard: LeaderboardResponse | null = null;
  if (slots.length > 0) {
    try {
      topLeaderboard = await getLeaderboard(slots[0].id);
    } catch {
      topLeaderboard = null;
    }
  }

  const distributedItems = summary?.empire_rewards ?? [];
  const burnedItems = summary?.burned_rewards ?? summary?.burned ?? [];

  // Empire endpoint has canonical lifetime totals; summary endpoint only
  // returns the 3 most recent of each kind. Prefer empire-level when present.
  const lifetimeDistributedUsd =
    toNumber(empireData?.total_distributed) ||
    distributedItems.reduce(
      (acc, item) => acc + toNumber(item.amount_usd ?? item.amount ?? item.total_amount),
      0,
    );
  const lifetimeBurned =
    toNumber(empireData?.total_burned) ||
    burnedItems.reduce((acc, item) => acc + toNumber(item.amount ?? item.total_amount), 0);

  return {
    empire: empireData,
    topLeaderboard,
    rewardsSummary: summary,
    totals: {
      lifetimeDistributedUsd,
      lifetimeBurned,
      distributionCount: distributedItems.length,
      burnCount: burnedItems.length,
    },
  };
}
