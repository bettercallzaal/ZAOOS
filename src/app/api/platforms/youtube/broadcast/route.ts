import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const BroadcastSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional().default(''),
});

async function refreshYouTubeToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = BroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Get YouTube connection
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('connected_platforms')
      .select('*')
      .eq('user_fid', session.fid)
      .eq('platform', 'youtube')
      .single();

    if (platformError || !platform) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 });
    }

    // Refresh token if expired
    let accessToken = platform.access_token;
    if (platform.expires_at && new Date(platform.expires_at) < new Date()) {
      if (!platform.refresh_token) {
        return NextResponse.json({ error: 'YouTube token expired — please reconnect' }, { status: 401 });
      }
      const refreshed = await refreshYouTubeToken(platform.refresh_token);
      if (!refreshed.access_token) {
        logger.error('YouTube token refresh failed:', refreshed);
        return NextResponse.json({ error: 'YouTube token refresh failed — please reconnect' }, { status: 401 });
      }
      accessToken = refreshed.access_token;
      await supabaseAdmin
        .from('connected_platforms')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq('user_fid', session.fid)
        .eq('platform', 'youtube');
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Create broadcast
    const broadcastRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          snippet: {
            title: parsed.data.title,
            description: parsed.data.description,
            scheduledStartTime: new Date().toISOString(),
          },
          status: { privacyStatus: 'public' },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
          },
        }),
      }
    );
    const broadcast = await broadcastRes.json();

    if (!broadcast.id) {
      logger.error('YouTube create broadcast failed:', broadcast);
      return NextResponse.json({ error: 'Failed to create YouTube broadcast' }, { status: 500 });
    }

    // 2. Create stream
    const streamRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          snippet: { title: `ZAO Live - ${parsed.data.title}` },
          cdn: {
            frameRate: 'variable',
            ingestionType: 'rtmp',
            resolution: 'variable',
          },
        }),
      }
    );
    const stream = await streamRes.json();

    if (!stream.id) {
      logger.error('YouTube create stream failed:', stream);
      return NextResponse.json({ error: 'Failed to create YouTube stream' }, { status: 500 });
    }

    // 3. Bind stream to broadcast
    const bindRes = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcast.id}&part=id&streamId=${stream.id}`,
      { method: 'POST', headers }
    );
    const bindData = await bindRes.json();

    if (!bindData.id) {
      logger.error('YouTube bind stream failed:', bindData);
      return NextResponse.json({ error: 'Failed to bind YouTube stream to broadcast' }, { status: 500 });
    }

    const ingestUrl = stream.cdn?.ingestionInfo?.ingestionAddress;
    const streamKey = stream.cdn?.ingestionInfo?.streamName;

    return NextResponse.json({
      success: true,
      broadcastId: broadcast.id,
      streamId: stream.id,
      rtmpUrl: ingestUrl,
      streamKey,
      watchUrl: `https://youtube.com/watch?v=${broadcast.id}`,
    });
  } catch (error) {
    logger.error('YouTube broadcast error:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}
