import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const sendSchema = z.object({
  message: z.string().min(1).max(500),
  channel: z.string().min(1).max(100),
});

/** GET — Check Twitch chat capability + return channel info for popout */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const channel = req.nextUrl.searchParams.get('channel');
    if (!channel) {
      return NextResponse.json({ error: 'Missing channel parameter' }, { status: 400 });
    }

    // Look up the host's Twitch connection to check scopes
    const { data: platform } = await supabaseAdmin
      .from('connected_platforms')
      .select('platform_user_id, platform_username, scopes, access_token')
      .eq('user_fid', session.fid)
      .eq('platform', 'twitch')
      .single();

    const scopes = platform?.scopes?.split(' ') ?? [];
    const canSend = scopes.includes('chat:edit');
    const canRead = scopes.includes('chat:read');

    return NextResponse.json({
      channel,
      popoutUrl: `https://www.twitch.tv/popout/${encodeURIComponent(channel)}/chat`,
      connected: !!platform,
      canRead,
      canSend,
      platformUserId: platform?.platform_user_id ?? null,
    });
  } catch (error) {
    console.error('Twitch chat GET error:', error);
    return NextResponse.json({ error: 'Failed to check Twitch chat' }, { status: 500 });
  }
}

/** POST — Send a message to Twitch chat via Helix API */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, channel } = parsed.data;

    // Get sender's Twitch connection
    const { data: platform } = await supabaseAdmin
      .from('connected_platforms')
      .select('platform_user_id, access_token, scopes')
      .eq('user_fid', session.fid)
      .eq('platform', 'twitch')
      .single();

    if (!platform?.access_token) {
      return NextResponse.json({ error: 'Twitch account not connected' }, { status: 400 });
    }

    const scopes = platform.scopes?.split(' ') ?? [];
    if (!scopes.includes('chat:edit')) {
      return NextResponse.json({
        error: 'Missing chat:edit scope. Reconnect Twitch with chat send permissions.',
        needsReauth: true,
      }, { status: 400 });
    }

    // Resolve broadcaster ID from channel username
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Twitch not configured' }, { status: 500 });
    }

    const userRes = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(channel)}`,
      {
        headers: {
          Authorization: `Bearer ${platform.access_token}`,
          'Client-Id': clientId,
        },
      }
    );
    const userData = await userRes.json();
    const broadcasterId = userData.data?.[0]?.id;

    if (!broadcasterId) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Send chat message via Helix
    const chatRes = await fetch('https://api.twitch.tv/helix/chat/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${platform.access_token}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: broadcasterId,
        sender_id: platform.platform_user_id,
        message,
      }),
    });

    if (!chatRes.ok) {
      const err = await chatRes.json().catch(() => ({}));
      console.error('Twitch send chat error:', err);
      return NextResponse.json({ error: 'Failed to send message to Twitch' }, { status: chatRes.status });
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Twitch chat POST error:', error);
    return NextResponse.json({ error: 'Failed to send chat message' }, { status: 500 });
  }
}
