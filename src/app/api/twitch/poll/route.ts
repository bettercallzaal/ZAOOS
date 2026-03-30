import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getValidTwitchToken, createTwitchPoll, endTwitchPoll } from '@/lib/twitch/client';
import { logger } from '@/lib/logger';

const createSchema = z.object({
  title: z.string().min(1).max(60),
  choices: z.array(z.string().min(1).max(25)).min(2).max(5),
  duration: z.number().int().min(15).max(1800).optional(),
});

const endSchema = z.object({
  pollId: z.string().min(1),
  status: z.enum(['TERMINATED', 'ARCHIVED']),
});

/** POST — create a Twitch poll */
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

    const result = await createTwitchPoll(creds.accessToken, creds.userId, {
      title: parsed.data.title,
      choices: parsed.data.choices,
      duration: parsed.data.duration,
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to create poll — stream must be live' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pollId: result.id });
  } catch (error) {
    logger.error('Twitch poll create error:', error);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}

/** PATCH — end a Twitch poll */
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

    const ok = await endTwitchPoll(creds.accessToken, creds.userId, parsed.data.pollId, parsed.data.status);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to end poll' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Twitch poll end error:', error);
    return NextResponse.json({ error: 'Failed to end poll' }, { status: 500 });
  }
}
