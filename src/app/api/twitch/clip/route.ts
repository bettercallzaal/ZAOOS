import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getValidTwitchToken, createTwitchClip } from '@/lib/twitch/client';
import { logger } from '@/lib/logger';

/** POST — create a Twitch clip */
export async function POST() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creds = await getValidTwitchToken(session.fid);
    if (!creds) {
      return NextResponse.json({ error: 'Twitch not connected' }, { status: 400 });
    }

    const result = await createTwitchClip(creds.accessToken, creds.userId);
    if (!result) {
      return NextResponse.json({ error: 'Failed to create clip — stream must be live' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      clipId: result.id,
      editUrl: result.editUrl,
    });
  } catch (error) {
    logger.error('Twitch clip error:', error);
    return NextResponse.json({ error: 'Failed to create clip' }, { status: 500 });
  }
}
