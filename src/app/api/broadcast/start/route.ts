import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const StartSchema = z.object({
  platforms: z.array(z.string()).min(1),
  roomTitle: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { platforms, roomTitle } = parsed.data;
    const destinations = [];

    for (const platform of platforms) {
      const { data: conn } = await supabaseAdmin
        .from('connected_platforms')
        .select('*')
        .eq('user_fid', session.fid)
        .eq('platform', platform)
        .single();

      if (!conn) continue;

      if (platform === 'youtube') {
        // Create YouTube broadcast via dedicated route
        try {
          const res = await fetch(`${req.nextUrl.origin}/api/platforms/youtube/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || '',
            },
            body: JSON.stringify({ title: roomTitle }),
          });
          const data = await res.json();
          if (data.rtmpUrl && data.streamKey) {
            destinations.push({
              platform: 'youtube',
              name: conn.platform_display_name || 'YouTube',
              rtmpUrl: data.rtmpUrl,
              streamKey: data.streamKey,
              watchUrl: data.watchUrl,
            });
          }
        } catch (err) {
          logger.error('YouTube broadcast error:', err);
        }
      } else if (platform === 'facebook') {
        // Create Facebook live video via dedicated route
        try {
          const res = await fetch(`${req.nextUrl.origin}/api/platforms/facebook/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || '',
            },
            body: JSON.stringify({ title: roomTitle }),
          });
          const data = await res.json();
          if (data.rtmpUrl && data.streamKey) {
            destinations.push({
              platform: 'facebook',
              name: conn.platform_display_name || 'Facebook',
              rtmpUrl: data.rtmpUrl,
              streamKey: data.streamKey,
            });
          }
        } catch (err) {
          logger.error('Facebook broadcast error:', err);
        }
      } else {
        // Twitch, Kick — already have stream key saved
        if (conn.rtmp_url && conn.stream_key) {
          destinations.push({
            platform,
            name: conn.platform_display_name || conn.platform_username || platform,
            rtmpUrl: conn.rtmp_url,
            streamKey: conn.stream_key,
          });
        }
      }
    }

    return NextResponse.json({ destinations });
  } catch (error) {
    logger.error('Broadcast start error:', error);
    return NextResponse.json({ error: 'Failed to start broadcast' }, { status: 500 });
  }
}
