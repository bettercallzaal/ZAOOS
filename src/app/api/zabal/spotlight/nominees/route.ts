import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUsersByFids } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

/**
 * GET /api/zabal/spotlight/nominees?limit=8
 * Top nominees for the current week with Farcaster usernames resolved.
 * Public read.
 */
export async function GET(req: NextRequest) {
  const rawLimit = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(rawLimit) || 8, 1), 50);

  const { data: rows, error } = await supabaseAdmin.rpc('get_zabal_spotlight_nominees', {
    p_limit: limit,
  });
  if (error) {
    logger.error?.('[zabal] get_zabal_spotlight_nominees error', { err: error.message });
    return NextResponse.json({ error: 'Read failed' }, { status: 500 });
  }
  const nominees = (rows ?? []) as Array<{
    nominee_fid: number;
    nomination_count: number;
    reasons: string[] | null;
  }>;

  if (nominees.length === 0) {
    return NextResponse.json({ nominees: [] });
  }

  let userByFid = new Map<number, { username?: string; pfp_url?: string }>();
  try {
    const users = (await getUsersByFids(nominees.map((n) => n.nominee_fid))) as Array<{
      fid: number;
      username?: string;
      pfp_url?: string;
    }>;
    userByFid = new Map(users.map((u) => [u.fid, { username: u.username, pfp_url: u.pfp_url }]));
  } catch (err) {
    logger.warn?.('[zabal] getUsersByFids for nominees failed', { err: String(err) });
  }

  return NextResponse.json({
    nominees: nominees.map((n) => ({
      ...n,
      username: userByFid.get(n.nominee_fid)?.username ?? null,
      pfp_url: userByFid.get(n.nominee_fid)?.pfp_url ?? null,
    })),
  });
}
