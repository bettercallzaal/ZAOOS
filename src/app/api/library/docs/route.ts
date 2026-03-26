import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query = supabaseAdmin
      .from('research_docs')
      .select('*')
      .order('id', { ascending: true });

    if (search) {
      const safeSearch = search.replace(/[%_,().\\]/g, '');
      if (safeSearch) {
        query = query.ilike('title', `%${safeSearch}%`);
      }
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: docs, error } = await query;
    if (error) throw error;

    return NextResponse.json({ docs: docs || [] });
  } catch (error) {
    console.error('[library/docs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch docs' }, { status: 500 });
  }
}
