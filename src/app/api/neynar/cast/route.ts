import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const CastSchema = z.object({
  text: z.string().min(1).max(1024),
  embeds: z.array(z.string().url()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { text, embeds } = parsed.data;
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        text,
        embeds: embeds.map((url) => ({ url })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error('Neynar cast error:', data);
      return NextResponse.json({ error: 'Failed to publish cast' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cast: data.cast });
  } catch (error) {
    logger.error('Cast route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
