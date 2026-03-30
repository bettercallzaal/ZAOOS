import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const BroadcastSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  // Optional: override which page to stream to (defaults to primary page)
  pageId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = BroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Get Facebook connection
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('connected_platforms')
      .select('*')
      .eq('user_fid', session.fid)
      .eq('platform', 'facebook')
      .single();

    if (platformError || !platform) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }

    const meta = (platform.metadata as Record<string, unknown>) || {};
    const pages = (meta.pages as Array<{ id: string; name: string; access_token: string }>) || [];

    // Resolve which page to use
    const targetPageId = parsed.data.pageId || (meta.primary_page_id as string) || null;
    const targetPage = pages.find((p) => p.id === targetPageId) || pages[0] || null;

    if (!targetPage) {
      return NextResponse.json(
        {
          error: 'No Facebook Page found. You must manage at least one Facebook Page to go live.',
        },
        { status: 400 }
      );
    }

    // Use the page access token (not user token) for live video creation
    const pageAccessToken = targetPage.access_token;

    // Create live video on the Facebook Page
    const liveVideoRes = await fetch(
      `https://graph.facebook.com/v19.0/${targetPage.id}/live_videos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsed.data.title,
          description: parsed.data.description,
          status: 'LIVE_NOW',
          access_token: pageAccessToken,
        }),
      }
    );

    const liveVideoData = await liveVideoRes.json();

    if (!liveVideoData.id || !liveVideoData.stream_url) {
      logger.error('Facebook create live video failed:', liveVideoData);
      return NextResponse.json(
        { error: 'Failed to create Facebook live video', details: liveVideoData.error?.message },
        { status: 500 }
      );
    }

    // stream_url is the full RTMP URL including the stream key: rtmp://host/path/streamkey
    // Split it into base URL + stream key for use with broadcast tools
    const streamUrl: string = liveVideoData.stream_url;
    const lastSlash = streamUrl.lastIndexOf('/');
    const rtmpUrl = lastSlash > 8 ? streamUrl.substring(0, lastSlash) : streamUrl;
    const streamKey = lastSlash > 8 ? streamUrl.substring(lastSlash + 1) : '';

    return NextResponse.json({
      success: true,
      liveVideoId: liveVideoData.id,
      streamUrl,
      rtmpUrl,
      streamKey,
      pageId: targetPage.id,
      pageName: targetPage.name,
      watchUrl: `https://www.facebook.com/live/producer/${liveVideoData.id}`,
    });
  } catch (error) {
    logger.error('Facebook broadcast error:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}
