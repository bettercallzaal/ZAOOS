import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { Livepeer } from 'livepeer';
import { logger } from '@/lib/logger';

const ClipSchema = z.object({
  playbackId: z.string().min(1),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  name: z.string().optional(),
});

function getLivepeerClient() {
  const apiKey = process.env.LIVEPEER_API_KEY;
  if (!apiKey) throw new Error('LIVEPEER_API_KEY not configured');
  return new Livepeer({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ClipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const livepeer = getLivepeerClient();
    const clip = await livepeer.stream.createClip({
      playbackId: parsed.data.playbackId,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      name: parsed.data.name || `ZAO Clip ${Date.now()}`,
    });

    return NextResponse.json({ success: true, clip });
  } catch (error) {
    logger.error('Livepeer clip error:', error);
    return NextResponse.json({ error: 'Failed to create clip' }, { status: 500 });
  }
}
