import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { hideMessageSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = hideMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { castHash, reason } = parsed.data;

    const { error } = await supabaseAdmin
      .from('hidden_messages')
      .upsert({
        cast_hash: castHash,
        hidden_by_fid: session.fid,
        reason: reason || null,
      }, { onConflict: 'cast_hash' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hide message error:', error);
    return NextResponse.json({ error: 'Failed to hide message' }, { status: 500 });
  }
}
