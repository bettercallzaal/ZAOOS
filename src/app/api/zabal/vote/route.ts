import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import { zabalVoteSchema } from '@/lib/validation/zabal-schemas';

/**
 * POST /api/zabal/vote
 * Body: { fid: number, mode: 'music'|'governance'|'events'|'build' }
 *
 * Public endpoint (no ZAO OS auth gate). Trust model:
 *   - FID + mode shape validated client-side via Farcaster miniapp SDK
 *   - Server validates FID resolves via Neynar (anti-sybil) by reading from
 *     zabal_vote_power_cache; cache is populated by /api/zabal/calculate-vote-power
 *     which lives behind haatz read tier
 *   - One vote per FID per week enforced by unique index on zabal_votes
 *   - upsert_zabal_weekly_vote() replaces the existing vote if user already voted
 *
 * Returns: { previous_mode, new_mode, changed }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = zabalVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { fid, mode } = parsed.data;

  // Anti-sybil floor: require vote_power_cache row before accepting vote.
  // Caller must hit /api/zabal/calculate-vote-power first (which validates
  // FID via Neynar bulk).
  const { data: powerRow, error: powerErr } = await supabaseAdmin
    .from('zabal_vote_power_cache')
    .select('fid, username, vote_power')
    .eq('fid', fid)
    .maybeSingle();

  if (powerErr) {
    logger.error?.('[zabal] vote-power cache read error', { fid, err: powerErr.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  if (!powerRow) {
    return NextResponse.json(
      {
        error: 'Vote power not calculated. Call /api/zabal/calculate-vote-power first.',
      },
      { status: 412 },
    );
  }

  // Cast vote via SQL function (handles week-window, dedup, leaderboard trigger)
  const { data, error } = await supabaseAdmin.rpc('upsert_zabal_weekly_vote', {
    p_fid: fid,
    p_mode: mode,
  });

  if (error) {
    logger.error?.('[zabal] upsert_zabal_weekly_vote error', {
      fid,
      mode,
      err: error.message,
    });
    return NextResponse.json({ error: 'Vote failed', details: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!result) {
    return NextResponse.json({ error: 'Vote function returned no rows' }, { status: 500 });
  }

  return NextResponse.json({
    fid,
    username: powerRow.username,
    previous_mode: result.previous_mode,
    new_mode: result.new_mode,
    changed: result.changed,
    vote_power: powerRow.vote_power,
  });
}
