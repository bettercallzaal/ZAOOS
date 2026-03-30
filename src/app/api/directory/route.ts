import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const social = url.searchParams.get('social');
  const tag = url.searchParams.get('tag');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  try {
    let query = supabaseAdmin
      .from('community_profiles')
      .select('*', { count: 'exact' })
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (social) {
      query = query.not(social, 'is', null);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ profiles: data, total: count ?? 0, limit, offset });
  } catch (err) {
    logger.error('[directory] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch directory' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { id, tags, admin_notes, is_featured } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (tags !== undefined) updates.tags = tags;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (is_featured !== undefined) updates.is_featured = is_featured;

    const { error } = await supabaseAdmin
      .from('community_profiles')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[directory] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
