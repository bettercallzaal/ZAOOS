import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { postCast } from '@/lib/farcaster/neynar';
import { sendMessageSchema } from '@/lib/validation/schemas';
import { sendNotification } from '@/lib/notifications';

const ALLOWED_CHANNELS = ['zao', 'zabal', 'cocconcertz'];

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

    const { text, parentHash, embedHash, embedUrls, channel, crossPostChannels } = parsed.data;
    const primaryChannel = channel && ALLOWED_CHANNELS.includes(channel) ? channel : 'zao';

    // Build list of channels to post to
    const channels = new Set([primaryChannel]);
    if (crossPostChannels) {
      for (const ch of crossPostChannels) {
        if (ALLOWED_CHANNELS.includes(ch)) channels.add(ch);
      }
    }

    // Post to primary channel first
    const result = await postCast(session.signerUuid, text, primaryChannel, parentHash, embedHash, embedUrls);

    // Cross-post to additional channels (fire and forget)
    const additionalChannels = [...channels].filter((ch) => ch !== primaryChannel);
    if (additionalChannels.length > 0) {
      Promise.allSettled(
        additionalChannels.map((ch) =>
          postCast(session.signerUuid!, text, ch, undefined, embedHash, embedUrls)
        )
      ).catch(() => {});
    }

    // Send notification to other users (fire and forget)
    const channelList = [...channels].map((c) => `#${c}`).join(', ');
    const preview = text.length > 80 ? text.slice(0, 80) + '...' : text;
    sendNotification(
      `${session.displayName} in ${channelList}`,
      preview,
      `https://zaoos.com/chat`,
      `msg-${Date.now()}-${session.fid}`,
      session.fid // exclude sender
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      cast: result.cast,
      crossPosted: additionalChannels,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
