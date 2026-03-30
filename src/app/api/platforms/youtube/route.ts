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
      .select('platform_username, platform_display_name, platform_user_id')
      .eq('user_fid', session.fid)
      .eq('platform', 'youtube')
      .single();

    if (error || !data) return NextResponse.json({ connected: false });

    return NextResponse.json({
      connected: true,
      username: data.platform_username,
      displayName: data.platform_display_name,
      channelId: data.platform_user_id,
    });
  } catch (error) {
    logger.error('YouTube platform GET error:', error);
    return NextResponse.json({ error: 'Failed to get YouTube info' }, { status: 500 });
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
      .eq('platform', 'youtube');

    if (error) {
      logger.error('YouTube disconnect error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('YouTube platform DELETE error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
