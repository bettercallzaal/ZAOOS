import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET — Fetch notifications for the current user
 * Query: ?unread_only=true (optional)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const unreadOnly = req.nextUrl.searchParams.get('unread_only') === 'true';

  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('recipient_fid', session.fid)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

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

  return NextResponse.json({ notifications: data || [], unreadCount: count || 0 });
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

    if (body.all) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('recipient_fid', session.fid)
        .eq('read', false);
    } else if (body.ids?.length) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('recipient_fid', session.fid)
        .in('id', body.ids);
    } else {
      return NextResponse.json({ error: 'Provide ids or all: true' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
