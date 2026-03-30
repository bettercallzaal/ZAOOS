import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') || 'wins';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
  const linkedOnly = url.searchParams.get('linked_only') === 'true';

  const validSorts = ['wins', 'total_volume_sol'];
  const sortCol = validSorts.includes(sort) ? sort : 'wins';

  let query = supabaseAdmin
    .from('wavewarz_artists')
    .select('*')
    .order(sortCol, { ascending: false })
    .limit(limit);

  if (linkedOnly) {
    query = query.not('zao_fid', 'is', null);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[wavewarz-artists] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }

  return NextResponse.json({ artists: data }, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30' },
  });
}
