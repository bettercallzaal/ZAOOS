import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUsersByFids } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

/**
 * GET /api/zabal/empire-leaderboard
 *
 * Returns top 50 ZABAL focus voters as [{address, score}] for the $ZABAL
 * Empire on Empire Builder. EB pulls this URL on its own refresh schedule.
 *
 * Coordinate with yerbearserker/Adrian (divifly) to point the $ZABAL Empire
 * `apiLeaderboards` entry at this URL. See Doc 626 Part 10 DM template.
 *
 * Public read. CORS enabled for Empire Builder origin.
 */
export async function GET() {
  try {
    const { data: voters, error } = await supabaseAdmin
      .from('zabal_leaderboard_scores')
      .select('fid, total_votes')
      .order('total_votes', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!voters || voters.length === 0) {
      return jsonWithCors([]);
    }

    const fids = voters.map((v) => Number(v.fid)).filter((n) => Number.isFinite(n));
    const users = (await getUsersByFids(fids)) as Array<{
      fid: number;
      verified_addresses?: { eth_addresses?: string[] };
      custody_address?: string;
    }>;

    const addressByFid = new Map<number, string>();
    for (const u of users) {
      const addr = u.verified_addresses?.eth_addresses?.[0] ?? u.custody_address;
      if (addr) addressByFid.set(u.fid, addr);
    }

    const payload = voters
      .map((v) => ({
        address: addressByFid.get(Number(v.fid)),
        score: v.total_votes,
      }))
      .filter((p): p is { address: string; score: number } => Boolean(p.address));

    return jsonWithCors(payload);
  } catch (err) {
    logger.error?.('[zabal] empire-leaderboard error', { err: String(err) });
    return jsonWithCors({ error: 'Leaderboard read failed' }, 500);
  }
}

function jsonWithCors(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res;
}

export function OPTIONS() {
  return jsonWithCors(null);
}
