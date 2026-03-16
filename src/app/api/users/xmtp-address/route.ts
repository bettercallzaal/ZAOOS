import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

const schema = z.object({
  xmtpAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

/**
 * Save the user's XMTP-derived address so other members can discover them.
 */
export async function POST(req: Request) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ xmtp_address: parsed.data.xmtpAddress.toLowerCase() })
    .eq('fid', session.fid);

  if (error) {
    console.error('[xmtp-address] Failed to save:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
