import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      membersResult,
      sessionsResult,
      scoresResult,
      topByFractalResult,
      recentSessionsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('respect_members')
        .select('name, wallet_address, total_respect, fractal_respect, onchain_og, onchain_zor, fractal_count, event_respect, hosting_respect, bonus_respect, first_respect_at')
        .order('total_respect', { ascending: false }),

      supabaseAdmin
        .from('fractal_sessions')
        .select('id, name, session_date, scoring_era, participant_count, notes, created_at')
        .order('created_at', { ascending: true }),

      supabaseAdmin
        .from('fractal_scores')
        .select('score, rank, wallet_address'),

      supabaseAdmin
        .from('respect_members')
        .select('name, wallet_address, fractal_respect, fractal_count')
        .gt('fractal_respect', 0)
        .order('fractal_respect', { ascending: false })
        .limit(20),

      supabaseAdmin
        .from('fractal_sessions')
        .select(`
          id, name, session_date, scoring_era, participant_count, notes,
          fractal_scores ( member_name, wallet_address, rank, score )
        `)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const members = membersResult.data ?? [];
    const sessions = sessionsResult.data ?? [];
    const scores = scoresResult.data ?? [];

    const totalRespect = members.reduce((sum, m) => sum + Number(m.total_respect), 0);
    const totalFractalRespect = members.reduce((sum, m) => sum + Number(m.fractal_respect), 0);
    const totalOGOnchain = members.reduce((sum, m) => sum + Number(m.onchain_og), 0);
    const totalZOROnchain = members.reduce((sum, m) => sum + Number(m.onchain_zor), 0);
    const totalSessions = sessions.length;
    const totalParticipations = scores.length;
    const uniqueParticipants = new Set(scores.map(s => s.wallet_address).filter(Boolean)).size;
    const membersWithRespect = members.filter(m => Number(m.total_respect) > 0).length;

    // OG era sessions are imported from Airtable with notes containing "synced from Airtable"
    // ORDAO era sessions come from the Discord bot webhook (no Airtable marker)
    const ogSessions = sessions.filter(s => s.notes?.includes('synced from Airtable')).length;
    const ordaoSessions = sessions.length - ogSessions;

    const participationTimeline = sessions.map(s => ({
      name: s.name,
      date: s.session_date,
      era: s.scoring_era,
      participants: s.participant_count,
    }));

    const scoreDistribution: Record<number, number> = {};
    for (const s of scores) {
      const score = Number(s.score);
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
    }

    const respectCurve = members
      .filter(m => Number(m.total_respect) > 0)
      .map(m => ({
        name: m.name,
        total: Number(m.total_respect),
        fractal: Number(m.fractal_respect),
        og: Number(m.onchain_og),
        zor: Number(m.onchain_zor),
        events: Number(m.event_respect),
        hosting: Number(m.hosting_respect),
        bonus: Number(m.bonus_respect),
        sessions: m.fractal_count ?? 0,
      }));

    const topHosters = members
      .filter(m => Number(m.hosting_respect) > 0)
      .sort((a, b) => Number(b.hosting_respect) - Number(a.hosting_respect))
      .slice(0, 10)
      .map(m => ({ name: m.name, value: Number(m.hosting_respect) }));

    return NextResponse.json({
      overview: {
        totalRespect,
        totalFractalRespect,
        totalOGOnchain,
        totalZOROnchain,
        totalSessions,
        totalParticipations,
        uniqueParticipants,
        membersWithRespect,
        totalMembers: members.length,
        ogSessions,
        ordaoSessions,
      },
      participationTimeline,
      scoreDistribution,
      respectCurve,
      topByFractal: topByFractalResult.data ?? [],
      topHosters,
      recentSessions: recentSessionsResult.data ?? [],
    });
  } catch (err) {
    logger.error('Fractals analytics error:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
