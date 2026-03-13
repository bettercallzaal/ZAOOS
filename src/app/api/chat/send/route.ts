import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { postCast } from '@/lib/farcaster/neynar';
import { sendMessageSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.signerUuid) {
    return NextResponse.json({ error: 'No signer configured. Please approve a signer first.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { text, parentHash } = parsed.data;
    const result = await postCast(session.signerUuid, text, 'zao', parentHash);

    return NextResponse.json({ success: true, cast: result.cast });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
