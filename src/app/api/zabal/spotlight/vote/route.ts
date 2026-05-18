import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import { zabalSpotlightVoteSchema } from '@/lib/validation/zabal-schemas';

/**
 * POST /api/zabal/spotlight/vote
 * Body: { voter_fid, nominee_fid }
 *
 * Phase 2 of weekly spotlight (Thu-Sun in NYC). One vote per voter per week.
 * Voter must have a vote_power_cache row. Nominee must be among current
 * week's nominees (via get_zabal_spotlight_nominees).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = zabalSpotlightVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { voter_fid, nominee_fid } = parsed.data;

  const nycDow = nycDayOfWeek();
  if (nycDow < 4 || nycDow > 7) {
    return NextResponse.json(
      { error: 'Spotlight voting is open Thu-Sun NYC. Nominations Mon-Wed.' },
      { status: 400 },
    );
  }

  const { data: weekRow } = await supabaseAdmin.rpc('get_current_zabal_voting_week');
  const week = weekRow as string;

  // Anti-sybil: voter must have vote_power cache row
  const { data: powerRow } = await supabaseAdmin
    .from('zabal_vote_power_cache')
    .select('fid, username, vote_power')
    .eq('fid', voter_fid)
    .maybeSingle();
  if (!powerRow) {
    return NextResponse.json(
      { error: 'Voter must vote on /zabal first (primes vote-power cache).' },
      { status: 412 },
    );
  }

  // Verify nominee is in current week's ballot
  const { data: nominees, error: nomErr } = await supabaseAdmin.rpc(
    'get_zabal_spotlight_nominees',
    { p_limit: 8 },
  );
  if (nomErr) {
    logger.error?.('[zabal] get_zabal_spotlight_nominees error', { err: nomErr.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  const ballotFids = ((nominees ?? []) as Array<{ nominee_fid: number }>).map((n) => n.nominee_fid);
  if (!ballotFids.includes(nominee_fid)) {
    return NextResponse.json(
      { error: 'Nominee is not on this week’s ballot.' },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from('zabal_spotlight_votes').insert({
    week,
    voter_fid,
    nominee_fid,
    vote_power: powerRow.vote_power ?? 1,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already voted this week.' }, { status: 409 });
    }
    logger.error?.('[zabal] spotlight vote insert error', { err: error.message });
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }

  return NextResponse.json({ week, voter_fid, nominee_fid, vote_power: powerRow.vote_power });
}

function nycDayOfWeek(): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  });
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[fmt.format(new Date())] ?? 0;
}
