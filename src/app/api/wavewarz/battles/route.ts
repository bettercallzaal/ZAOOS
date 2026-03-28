import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '30'), 100);
    const artist = req.nextUrl.searchParams.get('artist');

    let query = supabaseAdmin
      .from('wavewarz_battle_log')
      .select('*')
      .order('settled_at', { ascending: false })
      .limit(limit);

    if (artist) {
      query = query.or(`artist_a.ilike.%${artist}%,artist_b.ilike.%${artist}%`);
    }

    const { data: battles, error } = await query;

    if (error) {
      console.error('[wavewarz/battles] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ battles: battles || [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('[wavewarz/battles] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
