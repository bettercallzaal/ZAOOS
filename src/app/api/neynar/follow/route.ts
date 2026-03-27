import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

const FollowSchema = z.object({
  targetFid: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = FollowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/user/follow', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        target_fids: [parsed.data.targetFid],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Neynar follow error:', data);
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    console.error('Follow route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
