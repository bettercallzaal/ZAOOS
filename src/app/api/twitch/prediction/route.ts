import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getValidTwitchToken, createTwitchPrediction, endTwitchPrediction } from '@/lib/twitch/client';
import { logger } from '@/lib/logger';

const createSchema = z.object({
  title: z.string().min(1).max(45),
  outcomes: z.array(z.string().min(1).max(25)).min(2).max(10),
  duration: z.number().int().min(30).max(1800).optional(),
});

const endSchema = z.object({
  predictionId: z.string().min(1),
  winningOutcomeId: z.string().min(1),
});

/** POST — create a Twitch prediction */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const creds = await getValidTwitchToken(session.fid);
    if (!creds) {
      return NextResponse.json({ error: 'Twitch not connected' }, { status: 400 });
    }

    const result = await createTwitchPrediction(creds.accessToken, creds.userId, {
      title: parsed.data.title,
      outcomes: parsed.data.outcomes,
      duration: parsed.data.duration,
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to create prediction — stream must be live' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      predictionId: result.id,
      outcomes: result.outcomes,
    });
  } catch (error) {
    logger.error('Twitch prediction create error:', error);
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
  }
}

/** PATCH — resolve a Twitch prediction */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = endSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const creds = await getValidTwitchToken(session.fid);
    if (!creds) {
      return NextResponse.json({ error: 'Twitch not connected' }, { status: 400 });
    }

    const ok = await endTwitchPrediction(
      creds.accessToken,
      creds.userId,
      parsed.data.predictionId,
      parsed.data.winningOutcomeId,
    );

    if (!ok) {
      return NextResponse.json({ error: 'Failed to resolve prediction' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Twitch prediction end error:', error);
    return NextResponse.json({ error: 'Failed to resolve prediction' }, { status: 500 });
  }
}
