import { NextRequest, NextResponse } from 'next/server';
import { getUserByFid, getUserCasts } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import { fidSchema } from '@/lib/validation/zabal-schemas';

/**
 * GET /api/zabal/calculate-vote-power?fid=NNN
 *
 * Computes per-FID weekly vote power for ZABAL Live Hub voting.
 *
 * Formula (matches legacy zabal.art):
 *   base       = 1
 *   zaoBonus   = match(zaoCasts) { >=50: 3, >=20: 2, >=5: 1, else 0 }
 *   neynarMul  = match(neynarUserScore) { >=0.9: 1.5, >=0.7: 1.25, <0.5: 0.5, else 1.0 }
 *   power      = min( round( (base + zaoBonus) * neynarMul ), 6 )
 *
 * Reads route through haatz tier-1 / Neynar tier-2 via existing
 * src/lib/farcaster/neynar.ts helpers.
 *
 * Result cached in zabal_vote_power_cache for 24h. Cache miss -> compute + upsert.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('fid');
  if (!raw) {
    return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
  }
  const parsed = fidSchema.safeParse(Number(raw));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
  }
  const fid = parsed.data;

  // Cache check (24h fresh)
  try {
    const { data: cached } = await supabaseAdmin
      .from('zabal_vote_power_cache')
      .select('fid, username, vote_power, zao_casts, neynar_score, updated_at')
      .eq('fid', fid)
      .maybeSingle();

    if (cached && cached.updated_at) {
      const ageMs = Date.now() - new Date(cached.updated_at).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return NextResponse.json({
          fid: cached.fid,
          username: cached.username,
          power: cached.vote_power,
          zaoCasts: cached.zao_casts,
          neynarScore: cached.neynar_score,
          source: 'cache',
        });
      }
    }
  } catch (err) {
    logger.warn?.('[zabal] cache read failed', { fid, err: String(err) });
  }

  // Live compute
  let username: string | null = null;
  let neynarScore = 0.5;
  let zaoCasts = 0;

  try {
    const user = await getUserByFid(fid);
    if (user) {
      username = user.username ?? null;
      // Neynar's experimental score, present on user/bulk responses
      const exp = (user as { experimental?: { neynar_user_score?: number } }).experimental;
      if (typeof exp?.neynar_user_score === 'number') {
        neynarScore = exp.neynar_user_score;
      }
    }
  } catch (err) {
    logger.warn?.('[zabal] getUserByFid failed', { fid, err: String(err) });
  }

  try {
    const casts = (await getUserCasts(fid, 100)) as Array<{
      channel?: { id?: string };
      parent_url?: string | null;
    }>;
    zaoCasts = casts.filter(
      (c) => c.channel?.id === 'zao' || (c.parent_url ?? '').includes('/zao'),
    ).length;
  } catch (err) {
    logger.warn?.('[zabal] getUserCasts failed', { fid, err: String(err) });
  }

  // Formula
  const base = 1;
  const zaoBonus = zaoCasts >= 50 ? 3 : zaoCasts >= 20 ? 2 : zaoCasts >= 5 ? 1 : 0;
  const neynarMul =
    neynarScore >= 0.9 ? 1.5 : neynarScore >= 0.7 ? 1.25 : neynarScore < 0.5 ? 0.5 : 1.0;
  const power = Math.min(Math.round((base + zaoBonus) * neynarMul), 6);

  // Upsert cache (fire and forget on failure)
  try {
    await supabaseAdmin.from('zabal_vote_power_cache').upsert(
      {
        fid,
        username,
        vote_power: power,
        zao_casts: zaoCasts,
        neynar_score: neynarScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fid' },
    );
  } catch (err) {
    logger.warn?.('[zabal] cache upsert failed', { fid, err: String(err) });
  }

  return NextResponse.json({
    fid,
    username,
    power,
    zaoCasts,
    neynarScore,
    source: 'live',
  });
}
