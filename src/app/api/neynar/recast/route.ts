import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

const RecastSchema = z.object({
  castHash: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RecastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/reaction', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        reaction_type: 'recast',
        target: parsed.data.castHash,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Neynar recast error:', data);
      return NextResponse.json({ error: 'Failed to recast' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    console.error('Recast route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
