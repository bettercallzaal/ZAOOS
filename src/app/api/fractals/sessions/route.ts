// src/app/api/fractals/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params', details: parsed.error.flatten() }, { status: 400 });
  }
  const { limit, offset } = parsed.data;

  try {
    const { data: sessions, error, count } = await supabaseAdmin
      .from('fractal_sessions')
      .select(`
        id,
        session_date,
        name,
        host_name,
        scoring_era,
        participant_count,
        notes,
        created_at,
        fractal_scores (
          id,
          member_name,
          wallet_address,
          rank,
          score
        )
      `, { count: 'exact' })
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ sessions: sessions ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('Fractal sessions error:', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
