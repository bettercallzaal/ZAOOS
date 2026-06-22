import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

const nexusLinksQuerySchema = z.object({
  portal_group: z.string().max(100).nullish(),
  category: z.string().max(100).nullish(),
  tag: z.string().max(100).nullish(),
  featured: z.string().max(10).nullish(),
});

/**
 * Public API: GET /api/nexus/links
 * Returns all active nexus links.
 * No auth required - RLS public read policy filters to is_active=true.
 *
 * Query params:
 *   ?portal_group=MUSIC    - filter by portal group
 *   ?category=ZAO Projects - filter by category
 *   ?tag=interview         - filter by tag
 *   ?featured=true         - only featured links
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = nexusLinksQuerySchema.safeParse({
      portal_group: searchParams.get('portal_group'),
      category: searchParams.get('category'),
      tag: searchParams.get('tag'),
      featured: searchParams.get('featured'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    const { portal_group: portalGroup, category, tag, featured } = parsed.data;

    let query = supabaseAdmin
      .from('nexus_links')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('subcategory')
      .order('sort_order');

    if (portalGroup) query = query.eq('portal_group', portalGroup);
    if (category) query = query.eq('category', category);
    if (tag) query = query.contains('tags', [tag]);
    if (featured === 'true') query = query.eq('is_featured', true);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
    }

    return NextResponse.json({
      links: data || [],
      count: data?.length || 0,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
