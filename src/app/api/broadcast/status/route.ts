import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const StatusSchema = z.object({
  roomId: z.string().uuid(),
});

interface ConnectedPlatform {
  platform: string;
  access_token: string;
  metadata: Record<string, unknown> | null;
}

async function fetchTwitchViewers(
  accessToken: string,
  metadata: Record<string, unknown> | null
): Promise<number | null> {
  const login = metadata?.login as string | undefined;
  if (!login) return null;

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return null;

  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const stream = data?.data?.[0];
  return stream ? (stream.viewer_count as number) : null;
}

async function fetchYouTubeViewers(
  accessToken: string
): Promise<number | null> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=statistics&broadcastStatus=active',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const broadcast = data?.items?.[0];
  if (!broadcast?.statistics?.concurrentViewers) return null;
  return parseInt(broadcast.statistics.concurrentViewers, 10);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get('roomId');
    const parsed = StatusSchema.safeParse({ roomId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: platforms, error } = await supabaseAdmin
      .from('connected_platforms')
      .select('platform, access_token, metadata')
      .eq('user_fid', session.fid);

    if (error) {
      logger.error('[broadcast/status] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch connected platforms' },
        { status: 500 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ viewerCounts: {} });
    }

    const results = await Promise.allSettled(
      (platforms as ConnectedPlatform[]).map(async (p) => {
        let count: number | null = null;

        switch (p.platform) {
          case 'twitch':
            count = await fetchTwitchViewers(p.access_token, p.metadata);
            break;
          case 'youtube':
            count = await fetchYouTubeViewers(p.access_token);
            break;
          case 'kick':
          case 'facebook':
          case 'custom':
          default:
            count = null;
            break;
        }

        return { platform: p.platform, count };
      })
    );

    const viewerCounts: Record<string, number | null> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        viewerCounts[result.value.platform] = result.value.count;
      }
    }

    return NextResponse.json({ viewerCounts });
  } catch (err) {
    logger.error('[broadcast/status] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
