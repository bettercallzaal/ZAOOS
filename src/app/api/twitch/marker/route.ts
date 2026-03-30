import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getValidTwitchToken, createTwitchMarker } from '@/lib/twitch/client';
import { logger } from '@/lib/logger';

const markerSchema = z.object({
  description: z.string().max(140).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = markerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Get a valid token (auto-refreshes if expired)
    const creds = await getValidTwitchToken(session.fid);

    if (!creds) {
      return NextResponse.json({ error: 'Twitch not connected or token expired, please reconnect' }, { status: 401 });
    }

    // Create stream marker via shared client
    const success = await createTwitchMarker(
      creds.accessToken,
      creds.userId,
      parsed.data.description || 'ZAO OS marker',
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create marker — stream must be live' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      marker: {
        created_at: new Date().toISOString(),
        description: parsed.data.description || 'ZAO OS marker',
      },
    });
  } catch (error) {
    logger.error('Twitch marker error:', error);
    return NextResponse.json({ error: 'Failed to create stream marker' }, { status: 500 });
  }
}
