import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { postCast } from '@/lib/farcaster/neynar';
import { sendMessageSchema } from '@/lib/validation/schemas';
import { sendNotification } from '@/lib/notifications';

const ALLOWED_CHANNELS = ['zao', 'zabal', 'coc'];

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

    const { text, parentHash, embedHash, channel } = parsed.data;
    const targetChannel = channel && ALLOWED_CHANNELS.includes(channel) ? channel : 'zao';
    const result = await postCast(session.signerUuid, text, targetChannel, parentHash, embedHash);

    // Send notification to other users (fire and forget)
    const preview = text.length > 80 ? text.slice(0, 80) + '...' : text;
    sendNotification(
      `${session.displayName} in #${targetChannel}`,
      preview,
      `https://zaoos.com/chat`,
      `msg-${Date.now()}-${session.fid}`,
      session.fid // exclude sender
    ).catch(() => {});

    return NextResponse.json({ success: true, cast: result.cast });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
