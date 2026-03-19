import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const markReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }),
]);

/**
 * GET — Fetch notifications for the current user
 * Query: ?unread_only=true (optional)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const unreadOnly = req.nextUrl.searchParams.get('unread_only') === 'true';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0', 10), 0);

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_fid', session.fid)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count: totalCount } = await query;

    if (error) {
      console.error('Notifications fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Also get unread count
    const { count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_fid', session.fid)
      .eq('read', false);

    return NextResponse.json({
      notifications: data || [],
      unreadCount: count || 0,
      total: totalCount ?? (data?.length || 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

/**
 * PATCH — Mark notifications as read
 * Body: { ids: string[] } or { all: true }
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Provide ids (uuid[]) or all: true', details: parsed.error.flatten() }, { status: 400 });
    }

    if ('all' in parsed.data) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('recipient_fid', session.fid)
        .eq('read', false);
    } else {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('recipient_fid', session.fid)
        .in('id', parsed.data.ids);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
