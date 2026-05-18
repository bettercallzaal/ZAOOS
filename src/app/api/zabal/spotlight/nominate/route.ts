import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import { zabalSpotlightNominateSchema } from '@/lib/validation/zabal-schemas';

/**
 * POST /api/zabal/spotlight/nominate
 * Body: { nominator_fid, nominee_fid, reason? }
 *
 * Phase 1 of weekly spotlight (Mon-Wed in NYC). Each nominator can submit
 * one nomination per nominee per week. nominator_fid != nominee_fid enforced
 * by DB CHECK constraint.
 *
 * Requires nominator to have a vote_power_cache row (proves Neynar-validated FID).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = zabalSpotlightNominateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { nominator_fid, nominee_fid, reason } = parsed.data;

  // Phase gate: only allow nominations Mon-Wed (NYC)
  const { data: weekRow, error: weekErr } = await supabaseAdmin.rpc(
    'get_current_zabal_voting_week',
  );
  if (weekErr || !weekRow) {
    logger.error?.('[zabal] get_current_zabal_voting_week error', { err: weekErr?.message });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  const week = weekRow as string;

  const nycDow = nycDayOfWeek();
  if (nycDow < 1 || nycDow > 3) {
    return NextResponse.json(
      { error: 'Nominations are open Mon-Wed NYC. Voting opens Thursday.' },
      { status: 400 },
    );
  }

  // Anti-sybil: require nominator to be a known voter
  const { data: powerRow } = await supabaseAdmin
    .from('zabal_vote_power_cache')
    .select('fid')
    .eq('fid', nominator_fid)
    .maybeSingle();
  if (!powerRow) {
    return NextResponse.json(
      { error: 'Nominator must vote on /zabal first (primes vote-power cache).' },
      { status: 412 },
    );
  }

  const { error } = await supabaseAdmin.from('zabal_spotlight_nominations').insert({
    week,
    nominator_fid,
    nominee_fid,
    reason: reason ?? null,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already nominated this person this week.' }, { status: 409 });
    }
    logger.error?.('[zabal] spotlight nominate insert error', { err: error.message });
    return NextResponse.json({ error: 'Nomination failed' }, { status: 500 });
  }

  return NextResponse.json({ week, nominator_fid, nominee_fid, reason: reason ?? null });
}

function nycDayOfWeek(): number {
  // 1=Mon ... 7=Sun in America/New_York
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  });
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[fmt.format(new Date())] ?? 0;
}
