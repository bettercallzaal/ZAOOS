import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

interface Session {
  id: string;
  name: string;
  session_date: string | null;
}

interface Member {
  name: string;
  wallet: string | null;
  fid: number | null;
  totalRespect: number;
}

interface MatrixCell {
  memberId: string;
  sessionId: string;
  score: number;
}

interface MatrixResponse {
  sessions: Session[];
  members: Member[];
  cells: MatrixCell[];
  stats: {
    totalSessions: number;
    totalMembers: number;
    totalRespect: number;
  };
}

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all sessions in chronological order
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('fractal_sessions')
      .select('id, name, session_date')
      .order('session_date', { ascending: true, nullsFirst: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Get all members ranked by total respect
    const { data: members, error: membersError } = await supabaseAdmin
      .from('respect_members')
      .select('name, wallet_address, fid, total_respect')
      .order('total_respect', { ascending: false });

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`);
    }

    // Get all fractal scores with session details
    const { data: scores, error: scoresError } = await supabaseAdmin
      .from('fractal_scores')
      .select('session_id, member_name, wallet_address, score');

    if (scoresError) {
      throw new Error(`Failed to fetch scores: ${scoresError.message}`);
    }

    // Build matrix cells - match scores by member_name to respect_members
    const cells: MatrixCell[] = [];
    if (scores && sessions && members) {
      const memberMap = new Map(members.map((m) => [m.name.toLowerCase(), m.name]));

      for (const score of scores) {
        const normalizedName = score.member_name?.toLowerCase();
        const memberName = normalizedName ? memberMap.get(normalizedName) : null;

        if (memberName && score.session_id && score.score) {
          cells.push({
            memberId: memberName,
            sessionId: score.session_id,
            score: Number(score.score),
          });
        }
      }
    }

    const sessionList: Session[] = (sessions || []).map((s) => ({
      id: s.id,
      name: s.name,
      session_date: s.session_date,
    }));

    const memberList: Member[] = (members || []).map((m) => ({
      name: m.name,
      wallet: m.wallet_address || null,
      fid: m.fid ? Number(m.fid) : null,
      totalRespect: Number(m.total_respect),
    }));

    const totalRespect = memberList.reduce((sum, m) => sum + m.totalRespect, 0);

    return NextResponse.json({
      sessions: sessionList,
      members: memberList,
      cells,
      stats: {
        totalSessions: sessionList.length,
        totalMembers: memberList.length,
        totalRespect,
      },
    } as MatrixResponse);
  } catch (err) {
    logger.error('Fractals matrix error:', err);
    return NextResponse.json({ error: 'Failed to load matrix data' }, { status: 500 });
  }
}
