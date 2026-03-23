import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { castHashSchema } from '@/lib/validation/schemas';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';

const reactSchema = z.object({
  type: z.enum(['like', 'recast']),
  hash: castHashSchema,
});

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.signerUuid) {
    return NextResponse.json({ error: 'No signer. Connect write access first.' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = reactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { type, hash } = parsed.data;

    const res = await fetch(`${NEYNAR_BASE}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENV.NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        reaction_type: type,
        target: hash,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Neynar reaction error:', { status: res.status, body: err });
      return NextResponse.json({ error: 'Reaction failed' }, { status: 502 });
    }

    // Fire-and-forget notification to cast author
    Promise.resolve(
      supabaseAdmin
        .from('channel_casts')
        .select('fid, author_display')
        .eq('hash', hash)
        .single()
    )
      .then(({ data: castData }) => {
        if (castData && castData.fid !== session.fid) {
          createInAppNotification({
            recipientFids: [castData.fid],
            type: 'message',
            title: `${session.displayName} ${type === 'like' ? 'liked' : 'recasted'} your post`,
            body: '',
            href: '/chat',
            actorFid: session.fid,
            actorDisplayName: session.displayName,
            actorPfpUrl: session.pfpUrl,
          }).catch((err) => {
            console.error('Reaction notification failed:', err);
          });
        }
      })
      .catch((err) => {
        console.error('Reaction notification lookup failed:', err);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('React error:', error);
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.signerUuid) {
    return NextResponse.json({ error: 'No signer' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = reactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { type, hash } = parsed.data;

    const res = await fetch(`${NEYNAR_BASE}/reaction`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENV.NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        reaction_type: type,
        target: hash,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Neynar unreact error:', { status: res.status, body: err });
      return NextResponse.json({ error: 'Reaction failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unreact error:', error);
    return NextResponse.json({ error: 'Failed to unreact' }, { status: 500 });
  }
}
