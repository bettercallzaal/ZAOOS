import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getValidTwitchToken, getTwitchStreamInfo } from '@/lib/twitch/client';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a valid token (auto-refreshes if expired)
    const creds = await getValidTwitchToken(session.fid);

    if (!creds) {
      return NextResponse.json({ isLive: false, connected: false });
    }

    // Fetch stream info via shared client
    const stream = await getTwitchStreamInfo(creds.accessToken, creds.userId);

    if (!stream) {
      return NextResponse.json({ isLive: false, connected: true });
    }

    const body = {
      isLive: true,
      connected: true,
      viewerCount: stream.viewerCount,
      title: stream.title,
      game: stream.gameName,
      startedAt: stream.startedAt,
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    logger.error('Twitch stream-info error:', error);
    return NextResponse.json({ error: 'Failed to fetch stream info' }, { status: 500 });
  }
}
