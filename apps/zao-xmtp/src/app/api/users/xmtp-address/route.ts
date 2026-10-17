import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setXmtpAddress } from '@/lib/directory';
import { getMemberSession } from '@/lib/session';

const schema = z.object({ xmtpAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/) });

/** POST - save the member's XMTP (burner) address so other members can find them. */
export async function POST(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });

    await setXmtpAddress(session.fid, parsed.data.xmtpAddress);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[xmtp-address]', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
