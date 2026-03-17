import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const fid = searchParams.get('fid');

  if (!wallet && !fid) {
    return NextResponse.json({ error: 'Missing wallet or fid parameter' }, { status: 400 });
  }

  try {
    // Fetch the member
    let memberQuery = supabaseAdmin
      .from('respect_members')
      .select('*');

    if (wallet) {
      memberQuery = memberQuery.ilike('wallet_address', wallet);
    } else if (fid) {
      memberQuery = memberQuery.eq('fid', Number(fid));
    }

    const { data: member, error: memberErr } = await memberQuery.maybeSingle();

    if (memberErr) throw memberErr;
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Fetch their fractal history: scores joined with sessions
    const { data: scores, error: scoresErr } = await supabaseAdmin
      .from('fractal_scores')
      .select(`
        id,
        rank,
        score,
        session_id,
        fractal_sessions (
          id,
          session_date,
          name,
          scoring_era
        )
      `)
      .or(
        wallet
          ? `wallet_address.ilike.${wallet}`
          : `member_name.eq.${member.name}`
      )
      .order('created_at', { ascending: false });

    if (scoresErr) throw scoresErr;

    // Format the fractal history
    const fractalHistory = (scores || []).map((s) => {
      const session = s.fractal_sessions as unknown as {
        id: string;
        session_date: string;
        name: string;
        scoring_era: string;
      } | null;
      return {
        session_date: session?.session_date ?? null,
        session_name: session?.name ?? null,
        scoring_era: session?.scoring_era ?? null,
        rank: s.rank,
        score: Number(s.score),
      };
    });

    // Sort by session_date descending
    fractalHistory.sort((a, b) => {
      if (!a.session_date) return 1;
      if (!b.session_date) return -1;
      return b.session_date.localeCompare(a.session_date);
    });

    return NextResponse.json({
      member: {
        name: member.name,
        wallet_address: member.wallet_address,
        fid: member.fid,
        total_respect: Number(member.total_respect),
        fractal_respect: Number(member.fractal_respect),
        event_respect: Number(member.event_respect),
        hosting_respect: Number(member.hosting_respect),
        bonus_respect: Number(member.bonus_respect),
        onchain_og: Number(member.onchain_og),
        onchain_zor: Number(member.onchain_zor),
        first_respect_at: member.first_respect_at,
        fractal_count: member.fractal_count,
        hosting_count: member.hosting_count,
      },
      fractalHistory,
    });
  } catch (err) {
    console.error('Respect member error:', err);
    return NextResponse.json({ error: 'Failed to load member data' }, { status: 500 });
  }
}
