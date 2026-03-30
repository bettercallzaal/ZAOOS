import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const TokenSchema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const verifyRes = await fetch('https://api.listenbrainz.org/1/validate-token', {
      headers: { Authorization: `Token ${parsed.data.token}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.valid) {
      return NextResponse.json({ error: 'Invalid ListenBrainz token' }, { status: 400 });
    }

    await supabaseAdmin
      .from('user_settings')
      .upsert(
        { fid: session.fid, listenbrainz_token: parsed.data.token },
        { onConflict: 'fid' }
      );

    return NextResponse.json({ success: true, username: verifyData.user_name });
  } catch (error) {
    logger.error('[listenbrainz] Error:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabaseAdmin
      .from('user_settings')
      .update({ listenbrainz_token: null })
      .eq('fid', session.fid);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[listenbrainz/disconnect] Error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
