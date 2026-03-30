import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Optional: look up another user's public Twitch info by FID (no secrets)
    const lookupFid = req.nextUrl.searchParams.get('fid');
    if (lookupFid) {
      const { data } = await supabaseAdmin
        .from('connected_platforms')
        .select('platform_username, platform_display_name')
        .eq('user_fid', Number(lookupFid))
        .eq('platform', 'twitch')
        .single();

      if (!data) return NextResponse.json({ connected: false });

      return NextResponse.json({
        connected: true,
        username: data.platform_username,
        displayName: data.platform_display_name,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('connected_platforms')
      .select('platform_username, platform_display_name, platform_user_id, stream_key, rtmp_url')
      .eq('user_fid', session.fid)
      .eq('platform', 'twitch')
      .single();

    if (error || !data) return NextResponse.json({ connected: false });

    return NextResponse.json({
      connected: true,
      username: data.platform_username,
      displayName: data.platform_display_name,
      streamKey: data.stream_key,
      rtmpUrl: data.rtmp_url,
    });
  } catch (error) {
    console.error('Twitch platform GET error:', error);
    return NextResponse.json({ error: 'Failed to get Twitch info' }, { status: 500 });
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
      .eq('platform', 'twitch');

    if (error) {
      console.error('Twitch disconnect error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Twitch platform DELETE error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
