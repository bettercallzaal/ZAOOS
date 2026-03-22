import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { wallet } = await params;
  const lookupValue = wallet.toLowerCase();

  try {
    // Try by wallet first, then by name
    let { data: member } = await supabaseAdmin
      .from('respect_members')
      .select('*')
      .eq('wallet_address', lookupValue)
      .maybeSingle();

    if (!member) {
      const { data: byName } = await supabaseAdmin
        .from('respect_members')
        .select('*')
        .ilike('name', lookupValue)
        .maybeSingle();
      member = byName;
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get all fractal scores by wallet or name
    const { data: scores } = await supabaseAdmin
      .from('fractal_scores')
      .select(`
        rank,
        score,
        wallet_address,
        member_name,
        fractal_sessions (
          id, name, session_date, scoring_era, participant_count, notes
        )
      `)
      .or(`wallet_address.eq.${member.wallet_address || '__none__'},member_name.eq.${member.name}`)
      .order('created_at', { ascending: false });

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
    const firstPlace = history.filter(h => h.rank === 1).length;
    const avgRank = history.length > 0
      ? Math.round((history.reduce((sum, h) => sum + h.rank, 0) / history.length) * 10) / 10
      : 0;

    return NextResponse.json({
      member,
      history,
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
