import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMember } from '@/lib/directory';
import { requireMember } from '@/lib/membership';

const fidSchema = z.coerce.number().int().positive();

/** GET - one member's profile, in the shape the ported NewConversationDialog reads. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ fid: string }> }) {
  try {
    const session = await requireMember({ persist: true });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = fidSchema.safeParse((await params).fid);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });

    const m = await getMember(parsed.data);
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      fid: m.fid,
      username: m.username,
      display_name: m.display_name,
      pfp_url: m.pfp_url,
      custody_address: '',
      verified_addresses: { eth_addresses: m.xmtp_address ? [m.xmtp_address] : [] },
    });
  } catch (error: unknown) {
    console.error('[users/fid]', error);
    return NextResponse.json({ error: 'Could not load member' }, { status: 500 });
  }
}
