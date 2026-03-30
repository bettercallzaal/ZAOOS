import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('connected_platforms')
      .select('platform_username, platform_display_name, platform_user_id, metadata')
      .eq('user_fid', session.fid)
      .eq('platform', 'facebook')
      .single();

    if (error || !data) return NextResponse.json({ connected: false });

    const meta = (data.metadata as Record<string, unknown>) || {};

    return NextResponse.json({
      connected: true,
      userId: data.platform_user_id,
      username: data.platform_username,
      displayName: data.platform_display_name,
      primaryPageId: meta.primary_page_id || null,
      primaryPageName: meta.primary_page_name || null,
      pages: (meta.pages as unknown[]) || [],
    });
  } catch (error) {
    logger.error('Facebook platform GET error:', error);
    return NextResponse.json({ error: 'Failed to get Facebook info' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabaseAdmin
      .from('connected_platforms')
      .delete()
      .eq('user_fid', session.fid)
      .eq('platform', 'facebook');

    if (error) {
      logger.error('Facebook disconnect error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Facebook platform DELETE error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
