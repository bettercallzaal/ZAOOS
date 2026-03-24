import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const MEMBER_FIELDS = 'name, wallet_address, total_respect, fractal_respect, onchain_og, onchain_zor, fractal_count, event_respect, hosting_respect, bonus_respect, first_respect_at';

const walletSchema = z.string().min(1).max(100);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { wallet } = await params;
  const parsed = walletSchema.safeParse(wallet);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lookup value' }, { status: 400 });
  }
  const lookupValue = parsed.data.toLowerCase();

  try {
    // Try by wallet first, then by name
    let { data: member } = await supabaseAdmin
      .from('respect_members')
      .select(MEMBER_FIELDS)
      .eq('wallet_address', lookupValue)
      .maybeSingle();

    if (!member) {
      const { data: byName } = await supabaseAdmin
        .from('respect_members')
        .select(MEMBER_FIELDS)
        .ilike('name', lookupValue)
        .maybeSingle();
      member = byName;
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get scores by wallet and by name separately to avoid .or() filter injection
    const [walletScores, nameScores] = await Promise.all([
      member.wallet_address
        ? supabaseAdmin
            .from('fractal_scores')
            .select(`rank, score, wallet_address, member_name, fractal_sessions (id, name, session_date, scoring_era, participant_count, notes)`)
            .eq('wallet_address', member.wallet_address)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabaseAdmin
        .from('fractal_scores')
        .select(`rank, score, wallet_address, member_name, fractal_sessions (id, name, session_date, scoring_era, participant_count, notes)`)
        .eq('member_name', member.name)
        .order('created_at', { ascending: false }),
    ]);

    // Merge and deduplicate
    const allScores = [...(walletScores.data ?? []), ...(nameScores.data ?? [])];
    const seen = new Set<string>();
    const scores = allScores.filter(s => {
      const sess = Array.isArray(s.fractal_sessions) ? s.fractal_sessions[0] : s.fractal_sessions;
      const key = `${sess?.id}-${s.rank}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const history = (scores ?? []).map(s => {
      const sess = Array.isArray(s.fractal_sessions) ? s.fractal_sessions[0] : s.fractal_sessions;
      const isOrdao = sess?.notes?.includes('ORDAO') || sess?.notes?.includes('on-chain');
      const txMatch = sess?.notes?.match(/Tx: (0x[a-fA-F0-9]+)/);
      return {
        sessionName: sess?.name ?? 'Unknown',
        sessionDate: sess?.session_date,
        era: sess?.scoring_era ?? '2x',
        rank: s.rank,
        score: s.score,
        participants: sess?.participant_count ?? 0,
        source: isOrdao ? 'ordao' as const : 'og' as const,
        txHash: txMatch ? txMatch[1] : null,
      };
    });

    const totalFractalRespect = history.reduce((sum, h) => sum + h.score, 0);
    // Ranks are 1-6 only. Clamp any bad data from imports.
    const clampedHistory = history.map(h => ({ ...h, rank: Math.min(Math.max(h.rank, 1), 6) }));
    const firstPlace = clampedHistory.filter(h => h.rank === 1).length;
    const avgRank = clampedHistory.length > 0
      ? Math.round((clampedHistory.reduce((sum, h) => sum + h.rank, 0) / clampedHistory.length) * 10) / 10
      : 0;

    // Fetch respect events (non-fractal)
    const { data: events } = await supabaseAdmin
      .from('respect_events')
      .select('event_type, amount, description, event_date, created_at')
      .or(`member_name.ilike.${lookupValue},wallet_address.ilike.${lookupValue}`)
      .order('event_date', { ascending: false, nullsFirst: false });

    // Build unified ledger
    const ledger: { date: string | null; source: string; type: string; amount: number; detail: string }[] = [];
    for (const h of history) {
      ledger.push({ date: h.sessionDate, source: 'fractal', type: `Rank #${h.rank}`, amount: h.score, detail: h.sessionName });
    }
    for (const e of events || []) {
      ledger.push({
        date: e.event_date || e.created_at?.split('T')[0] || null,
        source: 'event',
        type: e.event_type,
        amount: Number(e.amount),
        detail: e.description || e.event_type,
      });
    }
    ledger.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

    return NextResponse.json({
      member,
      history,
      events: (events || []).map(e => ({
        event_type: e.event_type,
        amount: Number(e.amount),
        description: e.description,
        event_date: e.event_date,
      })),
      ledger,
      stats: {
        totalSessions: history.length,
        totalFractalRespect,
        firstPlace,
        avgRank,
        ogSessions: history.filter(h => h.source === 'og').length,
        ordaoSessions: history.filter(h => h.source === 'ordao').length,
      },
    });
  } catch (err) {
    console.error('Member profile error:', err);
    return NextResponse.json({ error: 'Failed to load member profile' }, { status: 500 });
  }
}
