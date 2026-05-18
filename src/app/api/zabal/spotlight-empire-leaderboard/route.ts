import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUsersByFids } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

/**
 * GET /api/zabal/spotlight-empire-leaderboard
 *
 * Cumulative spotlight winners formatted as [{address, score}] for the
 * $ZABAL Empire's second apiLeaderboard. Empire Builder pulls this URL.
 *
 * Score = total wins (count). Address = first verified eth address or custody.
 *
 * Coordinate with yerbearserker/Adrian on $ZABAL Empire setup. See Doc 626
 * Part 10 DM template.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_zabal_spotlight_leaderboard', {
      p_limit: 50,
    });
    if (error) throw error;

    const winners = (data ?? []) as Array<{ fid: number; wins: number }>;
    if (winners.length === 0) return jsonWithCors([]);

    const users = (await getUsersByFids(winners.map((w) => w.fid))) as Array<{
      fid: number;
      verified_addresses?: { eth_addresses?: string[] };
      custody_address?: string;
    }>;
    const addressByFid = new Map<number, string>();
    for (const u of users) {
      const addr = u.verified_addresses?.eth_addresses?.[0] ?? u.custody_address;
      if (addr) addressByFid.set(u.fid, addr);
    }

    const payload = winners
      .map((w) => ({ address: addressByFid.get(w.fid), score: w.wins }))
      .filter((p): p is { address: string; score: number } => Boolean(p.address));

    return jsonWithCors(payload);
  } catch (err) {
    logger.error?.('[zabal] spotlight-empire-leaderboard error', { err: String(err) });
    return jsonWithCors({ error: 'Read failed' }, 500);
  }
}

function jsonWithCors(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  return res;
}

export function OPTIONS() {
  return jsonWithCors(null);
}
