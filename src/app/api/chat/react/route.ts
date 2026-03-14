import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';

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
    const { type, hash } = await req.json();

    if (!['like', 'recast'].includes(type) || !hash) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

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
      return NextResponse.json({ error: err.message || 'Reaction failed' }, { status: res.status });
    }

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
    const { type, hash } = await req.json();

    if (!['like', 'recast'].includes(type) || !hash) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

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
      return NextResponse.json({ error: err.message || 'Unreact failed' }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unreact error:', error);
    return NextResponse.json({ error: 'Failed to unreact' }, { status: 500 });
  }
}
