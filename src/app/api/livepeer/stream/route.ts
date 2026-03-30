import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { Livepeer } from 'livepeer';
import { logger } from '@/lib/logger';

const CreateStreamSchema = z.object({
  name: z.string().min(1).max(100),
  targets: z.array(z.object({
    platform: z.string(),
    rtmpUrl: z.string(),
    streamKey: z.string(),
  })).min(1).max(10),
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
    const parsed = CreateStreamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const livepeer = getLivepeerClient();
    const { name, targets } = parsed.data;

    // Create multistream targets first
    const createdTargets: Array<{ id: string; profile: string }> = [];
    for (const target of targets) {
      const result = await livepeer.multistream.create({
        name: `${target.platform}-${session.fid}`,
        url: `${target.rtmpUrl}/${target.streamKey}`,
      });
      if (result.multistreamTarget?.id) {
        createdTargets.push({
          id: result.multistreamTarget.id,
          profile: 'source',
        });
      }
    }

    // Create stream with multistream targets
    const stream = await livepeer.stream.create({
      name: `zao-${name}-${Date.now()}`,
      multistream: {
        targets: createdTargets,
      },
      record: true,
    });

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.stream?.id,
        streamKey: stream.stream?.streamKey,
        rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live`,
        playbackId: stream.stream?.playbackId,
      },
    });
  } catch (error) {
    logger.error('Livepeer stream error:', error);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
