import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  type: z.enum(['members', 'respect', 'sessions']),
  format: z.enum(['csv', 'json']).default('csv'),
});

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => escapeCsvValue(row[h])).join(',')
    ),
  ];
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, format } = parsed.data;
    let rows: Record<string, unknown>[] = [];

    if (type === 'members') {
      const { data, error } = await supabaseAdmin
        .from('respect_members')
        .select(
          'name, wallet_address, fid, total_respect, fractal_respect, fractal_count, onchain_og, onchain_zor, hosting_respect, bonus_respect, event_respect, first_respect_at'
        )
        .order('total_respect', { ascending: false });
      if (error) throw error;
      rows = data ?? [];
    } else if (type === 'respect') {
      const { data, error } = await supabaseAdmin
        .from('fractal_scores')
        .select(
          'member_name, wallet_address, rank, score, session_id, fractal_sessions(name, session_date)'
        )
        .limit(5000);
      if (error) throw error;
      rows = (data ?? []).map((row: Record<string, unknown>) => {
        const session = row.fractal_sessions as Record<string, unknown> | null;
        return {
          member_name: row.member_name,
          wallet_address: row.wallet_address,
          rank: row.rank,
          score: row.score,
          session_id: row.session_id,
          session_name: session?.name ?? null,
          session_date: session?.session_date ?? null,
        };
      });
    } else if (type === 'sessions') {
      const { data, error } = await supabaseAdmin
        .from('fractal_sessions')
        .select('name, session_date, scoring_era, participant_count, notes')
        .order('session_date', { ascending: false });
      if (error) throw error;
      rows = data ?? [];
    }

    const date = new Date().toISOString().slice(0, 10);
    const ext = format === 'json' ? 'json' : 'csv';
    const filename = `zao-${type}-${date}.${ext}`;

    if (format === 'json') {
      const body = JSON.stringify(rows, null, 2);
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const body = buildCsv(rows);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    logger.error('[admin/export] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
